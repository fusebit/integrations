import { Connector, Internal } from '@fusebit-int/framework';
import AWS from 'aws-sdk';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import { IAssumeRoleConfiguration, IAwsConfig, IAwsToken } from './AwsTypes';
import * as templates from './template';

const getTokenClient = (ctx: Internal.Types.Context) =>
  ctx.state.tokenClient as Internal.Provider.BaseTokenClient<IAssumeRoleConfiguration>;
const ROLE_NAME = 'fusebit-aws-connector-role';
const AWS_TYPE = 'AWS';
const MAX_FX_RUNTIME = 900;
const S3_BASE_URL = 's3.amazonaws.com';
class AwsEngine {
  public cfg: IAwsConfig;

  constructor(private ctx: Connector.Types.Context) {
    this.cfg = ctx.state.manager.config.configuration as IAwsConfig;
  }

  private getAwsSdk<T>(AWSClient: new (creds: any) => T, token: IAwsToken) {
    return new AWSClient({
      region: this.cfg.IAM.region,
      ...token,
    });
  }

  public getBaseStsClient() {
    return this.getAwsSdk(AWS.STS, this.cfg.IAM);
  }

  /**
   * Returns a valid IAM key pair to the customer's AWS account.
   * The key pair defaults to time out after 900 seconds, which is the max time a integration
   * can run for, with some slack for HTTP transport between the connector and integration.
   * @returns {*} IAwsToken The temperary token of the customer.
   */
  public async assumeCustomerRole(cfg: IAssumeRoleConfiguration) {
    try {
      const baseStsClient = this.getBaseStsClient();
      const totpToken = authenticator.generate(this.cfg.IAM.otpSecret);
      const assumeRoleCredentials = await baseStsClient
        .assumeRole({
          ExternalId: cfg.externalId,
          RoleSessionName: uuidv4(),
          RoleArn: cfg.roleArn,
          TokenCode: totpToken,
          DurationSeconds: Math.max(MAX_FX_RUNTIME, parseInt(this.cfg.IAM.timeout)),
          SerialNumber: this.cfg.IAM.mfaSerial,
        })
        .promise();
      return this.sanitizeCredentials(assumeRoleCredentials.Credentials as AWS.STS.Credentials);
    } catch (e) {
      console.log(`CONNECTOR FAILURE: ASSUME CUSTOMER ROLE FAILURE ${(e as any).code}`);
      return undefined;
    }
  }

  // Generate the configuration as YAML, technically it is possible for JSON to be applied
  // But for ease of reading, sticking to YAML
  private async generateCustomerCloudformation(ctx: Connector.Types.Context, externalId: string, roleName: string) {
    const baseFile = this.cfg.customTemplate.cfnObject || templates.getCFNTemplate();
    return baseFile
      .replace('##BASE_ACCOUNT_ID##', (await this.getBaseAccountId(ctx)) as string)
      .replace('##EXTERNAL_ID##', externalId)
      .replace('##ROLE_NAME##', roleName);
  }

  private async uploadS3(ctx: Connector.Types.Context, CfnContent: string, sessionId: string) {
    const S3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    await S3Sdk.putObject({
      Bucket: this.cfg.bucketName,
      Body: Buffer.from(CfnContent),
      ContentType: 'text/plain',
      Key: `${this.cfg.bucketPrefix}/${sessionId}`,
    }).promise();

    return `https://${S3_BASE_URL}/${this.cfg.bucketName}/${`${this.cfg.bucketPrefix}/${sessionId}`}`;
  }

  public async cleanupS3(sessionId: string) {
    const bucketName = this.cfg.bucketName;
    const S3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    await S3Sdk.deleteObject({
      Bucket: this.cfg.bucketName,
      Key: `${bucketName}/${sessionId}`,
    }).promise();
  }

  public async handleFirstInstallStep(ctx: Connector.Types.Context) {
    const postPayload = JSON.parse(ctx.req.body.payload);

    const { accountId } = postPayload.payload;
    const { sessionId } = postPayload.state;
    const roleName = this.cfg.customTemplate.roleName || ROLE_NAME;

    // push configuration to session
    const { externalId } = await this.storeSetupInformation(ctx, accountId, roleName, sessionId);

    const template = await this.generateCustomerCloudformation(ctx, externalId, roleName);
    const S3Url = await this.uploadS3(ctx, template, sessionId);
    const consoleUrl = `https://${this.cfg.IAM.region}.console.aws.amazon.com/cloudformation/home?region=${
      this.cfg.IAM.region
    }#/stacks/create/review?templateUrl=${S3Url}&stackName=${this.cfg.stackName || 'connectorassumerolestack'}`;
    const FINAL_URL = `${ctx.state.params.baseUrl}/api/authorize/finalize?sessionId=${ctx.state.sessionId}`;

    let htmlTemplate = templates.getInstallCfn();
    htmlTemplate = htmlTemplate.replace('##WINDOW_TITLE##', this.cfg.configPage.windowTitle || 'Configure AWS');
    htmlTemplate = htmlTemplate.replace('##S3_URL##', S3Url);
    htmlTemplate = htmlTemplate.replace('##S3_CONSOLE_URL##', consoleUrl);
    htmlTemplate = htmlTemplate.replace('##FINAL_URL##', FINAL_URL);
    return htmlTemplate;
  }

  private async verifyCustomerCredentials(cfg: IAssumeRoleConfiguration): Promise<boolean> {
    const customerStsSdk = this.getAwsSdk(AWS.STS, cfg.cachedCredentials as IAwsToken);
    const me = await customerStsSdk.getCallerIdentity().promise();
    return me.Account === cfg.accountId;
  }

  private async getBaseAccountId(ctx: Connector.Types.Context): Promise<string | undefined> {
    const stsClient = new AWS.STS({
      accessKeyId: this.cfg.IAM.accessKeyId,
      secretAccessKey: this.cfg.IAM.secretAccessKey,
    });
    try {
      const me = await stsClient.getCallerIdentity().promise();
      return me.Account;
    } catch (e) {
      console.log(`CONNECTOR FAILURE: ${(e as any).code}`);
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

  public getFinalCallbackUrl = (ctx: Internal.Types.Context): string => {
    const url = new URL(`${ctx.state.params.baseUrl}/session/${ctx.query.sessionId}/callback`);
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
        const expiration = new Date(cfg.cachedCredentials?.expiration || 0);
        if (expiration < new Date()) {
          // credential expired
          break;
        }
        if (!(await this.verifyCustomerCredentials(cfg))) {
          return undefined;
        }
        return cfg.cachedCredentials;
      }
    } while (false);
    const assumedRoleCredential = await this.assumeCustomerRole(cfg);
    if (!assumedRoleCredential) {
      return undefined;
    }
    if (!(await this.verifyCustomerCredentials(cfg))) {
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

  public configToJsonForms() {
    return {
      type: AWS_TYPE,
      ...this.cfg,
    };
  }
}

export { AwsEngine };
