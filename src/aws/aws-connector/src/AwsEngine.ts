import { Connector, Internal } from '@fusebit-int/framework';
import AWS from 'aws-sdk';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IAssumeRoleConfiguration, IAwsConfig, IAwsToken } from './AwsTypes';

const SESSION_TIMEOUT_DURATION = 5 * 60;
const getTokenClient = (ctx: Internal.Types.Context): Internal.Provider.BaseTokenClient => ctx.state.tokenClient;

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
  public async generateCustomerCloudformation(ctx: Connector.Types.Context) {
    return fs
      .readFileSync('./templates/assumeRole.template', 'utf-8')
      .replace('##BASE_ACCOUNT_ID##', await this.getBaseAccountId(ctx) as string);
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

  private async generateCfnTemplate() {}
}

export { AwsEngine };
