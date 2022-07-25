import { Connector, Internal } from '@fusebit-int/framework';
import AWS, { S3 } from 'aws-sdk';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IAssumeRoleConfiguration, IAwsConfig, IAwsToken } from './AwsTypes';

const SESSION_TIMEOUT_DURATION = 5 * 60;
const getTokenClient = (ctx: Internal.Types.Context) => ctx.state.tokenClient as Internal.Provider.BaseTokenClient;
const ROLE_NAME = 'fusebit-aws-connector-role';

class AwsEngine {
  public cfg: IAwsConfig;

  constructor(private ctx: Connector.Types.Context) {
    this.cfg = ctx.state.manager.config.configuration as IAwsConfig;
  }

  private generateSessionName(): string {
    const randomId = uuidv4();
    return `${this.cfg.sessionNamePrefix || 'fusebit'}-${randomId}`;
  }

  private getAwsSdk<T>(AWSClient: new (creds: any) => T, token: IAwsToken) {
    return new AWSClient({
      // Defaulting region to us-east-1
      region: 'us-east-1',
      ...token,
    });
  }

  public getBaseStsClient() {
    return this.getAwsSdk(AWS.STS, this.cfg.baseUser as IAwsToken);
  }

  /**
   * Returns a valid IAM key pair to the customer's AWS account.
   * The key pair defaults to time out after 125 seconds, which is the max time a integration
   * can run for, with some slack for HTTP transport between the connector and integration.
   * @returns {*} IAwsToken The temperary token of the customer.
   */
  public async assumeCustomerRole(cfg: IAssumeRoleConfiguration) {
    try {
      const baseStsClient = this.getBaseStsClient();
      const assumeRoleCredentials = await baseStsClient
        .assumeRole({
          ExternalId: cfg.externalId,
          RoleSessionName: this.generateSessionName(),
          RoleArn: cfg.roleArn,
          DurationSeconds: SESSION_TIMEOUT_DURATION,
        })
        .promise();
      return this.sanitizeCredentials(assumeRoleCredentials.Credentials as AWS.STS.Credentials);
    } catch (e) {
      return undefined;
    }
  }

  // Generate the configuration as YAML, technically it is possible for JSON to be applied
  // But for ease of reading, sticking to YAML
  private async generateCustomerCloudformation(ctx: Connector.Types.Context, externalId: string, roleName: string) {
    return fs
      .readFileSync('./template/CFNTemplate.yml', 'utf-8')
      .replace('##BASE_ACCOUNT_ID##', (await this.getBaseAccountId(ctx)) as string)
      .replace('##EXTERNAL_ID##', externalId)
      .replace('##ROLE_NAME##', roleName);
  }

  private async UploadS3(ctx: Connector.Types.Context, CfnContent: string, sessionId: string) {
    const bucketName = this.cfg.bucket;
    const S3Sdk = this.getAwsSdk(AWS.S3, this.cfg.baseUser as IAwsToken);
    await S3Sdk.putObject({
      Bucket: bucketName.name,
      Body: Buffer.from(CfnContent),
      ContentType: 'text/plain',
      Key: bucketName.prefix ? `${bucketName.prefix}/${sessionId}` : sessionId,
    }).promise();

    return `https://s3.amazonaws.com/${bucketName.name}`;
  }

  private async CleanupS3(ctx: Connector.Types.Context, sessionId: string) {
    const bucketName = this.cfg.bucket;
    const S3Sdk = this.getAwsSdk(AWS.S3, this.cfg.baseUser as IAwsToken);
    await S3Sdk.deleteObject({
      Bucket: bucketName.name,
      Key: bucketName.prefix ? `${bucketName.prefix}/${sessionId}` : sessionId,
    }).promise();
  }

  public async handleFirstInstallStep(ctx: Connector.Types.Context) {
    const postPayload = JSON.parse(ctx.req.body.payload);

    const { accountId } = postPayload.payload;
    const { sessionId } = postPayload.state;
    const roleName = this.cfg.roleName || ROLE_NAME;

    // push configuration to session
    const { externalId } = await this.storeSetupInformation(ctx, accountId, roleName, sessionId);

    const template = await this.generateCustomerCloudformation(ctx, externalId, roleName);
    const S3Url = await this.UploadS3(ctx, template, sessionId);
    const consoleUrl = `https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-  1#/stacks/create/review?templateUrl=${S3Url}&stackName=${
      this.cfg.stackName || 'connectorassumerolestack'
    }`;

    let htmlTemplate = fs.readFileSync('template/installCfn.html', 'utf-8');
    htmlTemplate = htmlTemplate.replace('##WINDOW_TITLE##', this.cfg.configPage.windowTitle || 'Configure AWS');
    htmlTemplate = htmlTemplate.replace('##S3_URL##', S3Url);
    htmlTemplate = htmlTemplate.replace('##S3_CONSOLE_URL##', consoleUrl);
    return htmlTemplate;
  }

  private async getBaseAccountId(ctx: Connector.Types.Context): Promise<string | undefined> {
    const STSClient = new AWS.STS({
      accessKeyId: this.cfg.baseUser.accessKeyId,
      secretAccessKey: this.cfg.baseUser.secretAccessKey,
    });
    try {
      const me = await STSClient.getCallerIdentity().promise();
      return me.Account;
    } catch (e) {
      // Assume any non self retried failure to be the entire backend failed.
      ctx.throw(500);
    }
  }

  private sanitizeCredentials(rawCreds: AWS.STS.Credentials): IAwsToken {
    return {
      accessKeyId: rawCreds.AccessKeyId,
      secretAccessKey: rawCreds.SecretAccessKey,
      sessionToken: rawCreds.SessionToken,
      expiration: rawCreds.Expiration.toString(),
    };
  }

  public async storeSetupInformation(ctx: Connector.Types.Context, accountId: string, roleName: string, id: string) {
    const tokenClient = getTokenClient(ctx);
    const externalId = uuidv4();
    await tokenClient.put(
      {
        accountId: accountId,
        externalId: externalId,
        roleArn: `arn:aws:iam::${accountId}:role/${roleName}`,
      },
      id
    );

    return { externalId };
  }

  public getFinalCallbackUrl = async (ctx: Internal.Types.Context): Promise<string> => {
    const url = new URL(`${this.cfg.mountUrl}/session/${ctx.query.state}/callback`);
    Object.entries<string>(ctx.request.query).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  };

  public async ensureCrossAccountAccess(
    ctx: Connector.Types.Context,
    lookupKey: string
  ): Promise<IAwsToken | undefined> {
    const cfg: IAssumeRoleConfiguration = await getTokenClient(ctx).get(lookupKey);
    do {
      if (cfg.cachedCredentials) {
        // Validate cached credentials are valid
        const expiration = new Date(cfg.cachedCredentials.expiration);
        if (expiration > new Date()) {
          // credential expired
          break;
        }

        try {
          const customerStsSdk = this.getAwsSdk(AWS.STS, cfg.cachedCredentials);
          const me = await customerStsSdk.getCallerIdentity().promise();
          if (me.Account !== cfg.accountId) {
            break;
          }
          return cfg.cachedCredentials;
        } catch (e) {}
      }
    } while (false);
    const assumedRoleCredential = await this.assumeCustomerRole(cfg);
    if (!assumedRoleCredential) {
      return undefined;
    }
    const CustomerStsSdk = this.getAwsSdk(AWS.STS, assumedRoleCredential);

    // Basic validation to verify we assumed the right role
    const me = await CustomerStsSdk.getCallerIdentity().promise();

    // AccountId matches
    if (me.Account !== cfg.accountId) {
      return undefined;
    }

    // Update cached credentials within the session
    await getTokenClient(ctx).put(
      {
        ...cfg,
        cachedCredentials: assumedRoleCredential,
      },
      lookupKey
    );

    return assumedRoleCredential;
  }
}

export { AwsEngine };
