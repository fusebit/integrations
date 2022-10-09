import AWS from 'aws-sdk';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';
import { Connector, Internal } from '@fusebit-int/framework';
import { IAssumeRoleConfiguration, IAwsConfig, IAwsToken } from './AwsTypes';
import * as templates from './template';
import * as errors from './AwsError';

const DEFAULT_ROLE_NAME = 'fusebit-aws-connector-role';
const CONFIG_TYPE_AWS = 'AWS';
const MAX_AWS_SESS_DURATION = 3000;
const REFRESH_BACKOFF_ITER = 40;
const TIMEOUT_PER_ITER = 2;
const MAX_FUSEBIT_INTEGRATION_RUNTIME = 900;
// This is defined by the sum of the fusebit integration runtime and the max time a refresh is allowed to take
const TOTAL_MIN_TIME_BEFORE_REFRESH =
  (MAX_FUSEBIT_INTEGRATION_RUNTIME + REFRESH_BACKOFF_ITER * TIMEOUT_PER_ITER) * 1000;
const S3_BASE_URL = 's3.amazonaws.com';
const IAM_ARN_PREFIX = 'arn:aws:iam';
const RETRY_AFTER_TIME = 30 * 1000;
let proxyConfig: any;

const getTokenClient = (ctx: Internal.Types.Context) =>
  ctx.state.tokenClient as Internal.Provider.BaseTokenClient<IAssumeRoleConfiguration>;

class AwsEngine {
  public cfg: IAwsConfig;

  constructor(private ctx: Connector.Types.Context) {
    this.cfg = ctx.state.manager.config.configuration as IAwsConfig;
  }

  private getAwsSdk<T>(AWSClient: new (creds: any) => T, token: IAwsToken) {
    return new AWSClient({
      region: this.cfg.IAM?.region,
      ...token,
    });
  }

  public getBaseStsClient() {
    return this.getAwsSdk(AWS.STS, this.cfg.IAM);
  }

  public async getProxyCredentials(ctx: Internal.Types.Context) {
    if (proxyConfig) {
      return proxyConfig;
    }

    const response = await superagent.get(`${ctx.state.params.baseUrl}/proxy/aws/config`);

    proxyConfig = response.body;
    return proxyConfig;
  }

  /**
   * Returns a valid IAM key pair to the customer's AWS account.
   * The key pair defaults to time out after 900 seconds, which is the max time a integration
   * can run for, with some slack for HTTP transport between the connector and integration.
   * @returns {*} IAwsToken The temperary token of the customer.
   */
  public async assumeCustomerRole(ctx: Internal.Types.Context, cfg: IAssumeRoleConfiguration): Promise<IAwsToken> {
    try {
      const baseStsClient = this.getBaseStsClient();
      const totpToken = authenticator.generate(this.cfg.IAM?.otpSecret);
      let assumeRoleCredentials: any;
      const duration = Math.max(MAX_AWS_SESS_DURATION, parseInt(this.cfg.IAM.timeout || '0'));
      if (this.cfg.mode?.useProduction) {
        assumeRoleCredentials = await baseStsClient
          .assumeRole({
            ExternalId: cfg.externalId,
            RoleSessionName: uuidv4(),
            RoleArn: cfg.roleArn,
            TokenCode: totpToken,
            DurationSeconds: duration,
            SerialNumber: this.cfg.IAM?.mfaSerial,
          })
          .promise();
      } else {
        assumeRoleCredentials = (
          await superagent.post(`${ctx.state.params.baseUrl}/proxy/aws/action`).send({
            action: 'STS.AssumeRole',
            requestBody: { externalId: cfg.externalId, roleArn: cfg.roleArn, durationSeconds: duration },
          })
        ).body;
      }
      return this.sanitizeCredentials(assumeRoleCredentials.Credentials as AWS.STS.Credentials);
    } catch (e) {
      if ((e as any).message.includes('MultiFactorAuthentication failed with invalid MFA one time pass code.')) {
        throw new errors.RetryError('Please Retry');
      }
      console.log(`CONNECTOR FAILURE: ASSUME CUSTOMER ROLE FAILURE ${(e as any).code}`);
      throw new errors.AssumeRoleError('Assume Role Failure');
    }
  }

  // Generate the configuration as YAML, technically it is possible for JSON to be applied
  // But for ease of reading, sticking to YAML
  private async generateCustomerCloudformation(ctx: Connector.Types.Context, externalId: string, roleName: string) {
    const baseFile = this.cfg.customTemplate?.cfnObject || templates.getCFNTemplate();
    return baseFile
      .replace('##BASE_ACCOUNT_ID##', (await this.getBaseAccountId(ctx)) as string)
      .replace('##EXTERNAL_ID##', externalId)
      .replace('##ROLE_NAME##', roleName);
  }

  private async uploadS3(ctx: Connector.Types.Context, cfnContent: string, sessionId: string) {
    const s3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    if (this.cfg.mode?.useProduction) {
      await s3Sdk
        .putObject({
          Bucket: this.cfg.bucketName,
          Body: Buffer.from(cfnContent),
          ContentType: 'text/plain',
          Key: `${this.cfg.bucketPrefix}/${sessionId}`,
        })
        .promise();
    } else {
      await superagent
        .post(`${ctx.state.params.baseUrl}/proxy/aws/action`)
        .send({ action: 'S3.PutObject', requestBody: { sessionId, body: cfnContent } });
    }

    return `https://${S3_BASE_URL}/${
      this.cfg.mode?.useProduction ? this.cfg.bucketName : (await this.getProxyCredentials(ctx)).bucketName
    }/${`${
      this.cfg.mode?.useProduction ? this.cfg.bucketPrefix : (await this.getProxyCredentials(ctx)).bucketPrefix
    }/${sessionId}`}`;
  }

  public async cleanupS3(ctx: Internal.Types.Context, sessionId: string) {
    const bucketName = this.cfg.bucketName;
    const s3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    if (this.cfg.mode?.useProduction) {
      await s3Sdk
        .deleteObject({
          Bucket: this.cfg.bucketName,
          Key: `${bucketName}/${sessionId}`,
        })
        .promise();
    } else {
      await superagent
        .post(`${ctx.state.params.baseUrl}/proxy/aws/action`)
        .send({ action: 'S3.DeleteObject', requestBody: { sessionId } });
    }
  }

  public async handleFirstInstallStep(ctx: Connector.Types.Context) {
    const postPayload = JSON.parse(ctx.req.body.payload);

    const { accountId, region } = postPayload.payload;
    const { sessionId } = postPayload.state;
    const roleName = this.cfg.customTemplate?.roleName || DEFAULT_ROLE_NAME;

    // push configuration to session
    const { externalId } = await this.storeSetupInformation(ctx, accountId, roleName, sessionId, region);

    const template = await this.generateCustomerCloudformation(ctx, externalId, roleName);
    const S3Url = await this.uploadS3(ctx, template, sessionId);
    const consoleUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?templateUrl=${S3Url}&stackName=${
      this.cfg.stackName || 'connectorassumerolestack'
    }`;
    const FINAL_URL = `${ctx.state.params.baseUrl}/api/authorize/finalize?sessionId=${ctx.state.sessionId}`;

    let htmlTemplate = templates.getInstallCfn();
    htmlTemplate = htmlTemplate.replace('##WINDOW_TITLE##', 'Configure AWS');
    htmlTemplate = htmlTemplate.replace('##S3_URL##', S3Url);
    htmlTemplate = htmlTemplate.replace('##S3_CONSOLE_URL##', consoleUrl);
    htmlTemplate = htmlTemplate.replace('##FINAL_URL##', FINAL_URL);
    return htmlTemplate;
  }

  private async getBaseAccountId(ctx: Connector.Types.Context): Promise<string | undefined> {
    const stsClient = new AWS.STS({
      accessKeyId: this.cfg.IAM?.accessKeyId,
      secretAccessKey: this.cfg.IAM?.secretAccessKey,
    });
    try {
      let me;
      if (this.cfg.mode?.useProduction) {
        me = await stsClient.getCallerIdentity().promise();
      } else {
        me = (
          await superagent.post(`${ctx.state.params.baseUrl}/proxy/aws/action`).send({
            action: 'STS.GetCallerIdentity',
          })
        ).body;
      }
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
      expiration: rawCreds.Expiration.getTime(),
    };
  }

  public async storeSetupInformation(
    ctx: Connector.Types.Context,
    accountId: string,
    roleName: string,
    id: string,
    region: string
  ) {
    const tokenClient = getTokenClient(ctx);
    const externalId = uuidv4();
    await tokenClient.put(
      {
        accountId: accountId,
        externalId: externalId,
        roleArn: `${IAM_ARN_PREFIX}::${accountId}:role/${roleName}`,
        region,
      },
      id
    );

    return { externalId };
  }

  public getFinalCallbackUrl = (ctx: Internal.Types.Context): string => {
    const url = new URL(`${ctx.state.params.baseUrl}/session/${ctx.query.sessionId || ctx.params.sessionId}/callback`);
    Object.entries<string>(ctx.request.query).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  };

  public async atomicRefresh(
    ctx: Internal.Types.Context,
    tokenClient: Internal.Provider.BaseTokenClient<IAssumeRoleConfiguration>,
    cfg: IAssumeRoleConfiguration,
    lookupKey: string
  ) {
    try {
      await tokenClient.put(
        {
          ...cfg,
          status: 'REFRESHING',
        },
        lookupKey
      );

      const assumedRoleCredentials = await this.assumeCustomerRole(ctx, cfg);
      await tokenClient.put({ ...cfg, cachedCredentials: assumedRoleCredentials, status: 'READY' }, lookupKey);

      return assumedRoleCredentials;
    } catch (e) {
      if (e instanceof errors.RetryError) {
        const retryAfter = new Date().getTime() + RETRY_AFTER_TIME;
        await tokenClient.put({ ...cfg, retryAfter: retryAfter }, lookupKey);
        return cfg.cachedCredentials;
      }

      await tokenClient.put({ ...cfg, status: 'FAILED' }, lookupKey);
      return cfg.cachedCredentials;
    }
  }

  public async ensureCrossAccountAccess(
    ctx: Connector.Types.Context,
    lookupKey: string,
    inRecursion?: boolean
  ): Promise<IAwsToken | undefined> {
    const tokenClient = getTokenClient(ctx);
    const cfg: IAssumeRoleConfiguration = await tokenClient.get(lookupKey);
    const cachedCredsTimeout = cfg.cachedCredentials?.expiration || 0;
    const isExpiring = cachedCredsTimeout - new Date().getTime() < TOTAL_MIN_TIME_BEFORE_REFRESH;

    // if there is no credential at all and it's not disabled, force a refresh
    if (!cfg.cachedCredentials && cfg.status !== 'FAILED') {
      await this.atomicRefresh(ctx, tokenClient, cfg, lookupKey);
    }

    // If system have been transitioned to permanent failure, immediately fail request to get token
    if (cfg.status === 'FAILED') {
      // Return existing credentials if they are still valid, otherwise fail completely
      if (cachedCredsTimeout > new Date().getTime()) {
        return cfg.cachedCredentials;
      }

      return undefined;
    }

    // base case ready and not near expiring
    if (cfg.status === 'READY' && !isExpiring) {
      return cfg.cachedCredentials;
    }

    // token is refreshing, credentials are not expired
    if (cfg.status === 'REFRESHING' && cachedCredsTimeout > new Date().getDate()) {
      return cfg.cachedCredentials;
    }

    // ready but need a quick refresh
    if (cfg.status === 'READY' && isExpiring) {
      // if inRecursion is set to true, this just means MFA token have gone bad, fail the request for now
      if (inRecursion) {
        // In this case, we just toss back the older creds for now
        // TODO: Implement task capability so this is not needed and we can use a background task to refresh
        return cfg.cachedCredentials;
      }

      if (cfg.retryAfter && cfg.retryAfter > new Date().getTime()) {
        return cfg.cachedCredentials;
      }

      await this.atomicRefresh(ctx, tokenClient, cfg, lookupKey);
      // This just ensures the new credentials are good to go
      return await this.ensureCrossAccountAccess(ctx, lookupKey, true);
    }

    return (await this.waitForRefresh(ctx, lookupKey, REFRESH_BACKOFF_ITER, TIMEOUT_PER_ITER))?.cachedCredentials;
  }

  private async waitForRefresh(
    ctx: Internal.Types.Context,
    lookupKey: string,
    count: number,
    backoff: number
  ): Promise<IAssumeRoleConfiguration | undefined> {
    const tokenClient = getTokenClient(ctx);
    if (count <= 0) {
      return undefined;
    }

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const token = await tokenClient.get(lookupKey);
        try {
          if (token.status === 'FAILED') {
            throw new errors.RefreshFailedError('Concurrent AWS Token Refresh Operation Failed');
          }
        } catch (e) {
          reject(new errors.WaitForRefreshFailedError(`Error waiting for access token refresh: ${(e as any).message}`));
        }
        if (token.status === 'READY') {
          resolve(token);
        }

        let result;
        try {
          result = await this.waitForRefresh(ctx, lookupKey, count - 1, backoff);
        } catch (e) {
          reject(e);
        }

        return resolve(result);
      }, backoff);
    });
  }

  public configToJsonForms() {
    return {
      type: CONFIG_TYPE_AWS,
      ...this.cfg,
    };
  }
}

export { AwsEngine };
