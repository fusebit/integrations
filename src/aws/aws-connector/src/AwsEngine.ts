import { Connector, Internal } from '@fusebit-int/framework';
import AWS from 'aws-sdk';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import { IAssumeRoleConfiguration, IAwsConfig, IAwsToken } from './AwsTypes';
import * as templates from './template';

const getTokenClient = (ctx: Internal.Types.Context) =>
  ctx.state.tokenClient as Internal.Provider.BaseTokenClient<IAssumeRoleConfiguration>;
const DEFAULT_ROLE_NAME = 'fusebit-aws-connector-role';
const AWS_TYPE = 'AWS';
const MAX_FX_RUNTIME = 3000;
const MIN_TIME_BEFORE_REFRESH_MS = 900 * 1000;
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
          DurationSeconds: Math.max(MAX_FX_RUNTIME, parseInt(this.cfg.IAM.timeout || '0')),
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

  private async uploadS3(ctx: Connector.Types.Context, cfnContent: string, sessionId: string) {
    const s3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    await s3Sdk
      .putObject({
        Bucket: this.cfg.bucketName,
        Body: Buffer.from(cfnContent),
        ContentType: 'text/plain',
        Key: `${this.cfg.bucketPrefix}/${sessionId}`,
      })
      .promise();

    return `https://${S3_BASE_URL}/${this.cfg.bucketName}/${`${this.cfg.bucketPrefix}/${sessionId}`}`;
  }

  public async cleanupS3(sessionId: string) {
    const bucketName = this.cfg.bucketName;
    const s3Sdk = this.getAwsSdk(AWS.S3, this.cfg.IAM);
    await s3Sdk
      .deleteObject({
        Bucket: this.cfg.bucketName,
        Key: `${bucketName}/${sessionId}`,
      })
      .promise();
  }

  public async handleFirstInstallStep(ctx: Connector.Types.Context) {
    const postPayload = JSON.parse(ctx.req.body.payload);

    const { accountId, region } = postPayload.payload;
    const { sessionId } = postPayload.state;
    const roleName = this.cfg.customTemplate.roleName || DEFAULT_ROLE_NAME;

    // push configuration to session
    const { externalId } = await this.storeSetupInformation(ctx, accountId, roleName, sessionId, region);

    const template = await this.generateCustomerCloudformation(ctx, externalId, roleName);
    const S3Url = await this.uploadS3(ctx, template, sessionId);
    const consoleUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?templateUrl=${S3Url}&stackName=${
      this.cfg.stackName || 'connectorassumerolestack'
    }`;
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
        roleArn: `arn:aws:iam::${accountId}:role/${roleName}`,
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
    tokenClient: Internal.Provider.BaseTokenClient<IAssumeRoleConfiguration>,
    cfg: IAssumeRoleConfiguration,
    lookupKey: string
  ) {
    await tokenClient.put(
      { ...cfg, status: 'REFRESHING', cachedCredentials: { accessKeyId: '', secretAccessKey: '' } },
      lookupKey
    );

    const assumedRoleCredentials = await this.assumeCustomerRole(cfg);
    // transition to state = FAILED if the system failed to assume role
    if (assumedRoleCredentials === undefined) {
      await tokenClient.put(
        { ...cfg, cachedCredentials: { accessKeyId: '', secretAccessKey: '' }, status: 'FAILED' },
        lookupKey
      );
      return;
    }

    await tokenClient.put({ ...cfg, cachedCredentials: assumedRoleCredentials, status: 'READY' }, lookupKey);

    return assumedRoleCredentials;
  }

  public async ensureCrossAccountAccess(
    ctx: Connector.Types.Context,
    lookupKey: string
  ): Promise<IAwsToken | undefined> {
    const tokenClient = getTokenClient(ctx);
    const cfg: IAssumeRoleConfiguration = await tokenClient.get(lookupKey);
    // If system have been transitioned to permanent failure, immediately fail request to get token
    if (cfg.status === 'FAILED') {
      return undefined;
    }
    // If there is no cached creds at all, immediately transition to refresh
    if (
      !cfg.cachedCredentials ||
      (cfg.cachedCredentials.expiration || 0) - new Date().getTime() < MIN_TIME_BEFORE_REFRESH_MS
    ) {
      return await this.atomicRefresh(tokenClient, cfg, lookupKey);
    }

    if (cfg.status === 'REFRESHING') {
      const maxIteration = parseInt(this.cfg.refreshTimeout) / 1000;
      for (let i = 0; i < maxIteration; i++) {
        const token = await tokenClient.get(lookupKey);
        if (token.status === 'READY') {
          return token.cachedCredentials;
        }

        await new Promise((res) => setTimeout(res, 1000));
      }

      // status failed to transition to healthy, retry renew
      await tokenClient.put(
        {
          ...cfg,
          status: 'READY',
          cachedCredentials: {
            accessKeyId: '',
            secretAccessKey: '',
            expiration: 0,
          },
        },
        lookupKey
      );
      return await this.atomicRefresh(tokenClient, cfg, lookupKey);
    }

    return cfg.cachedCredentials;
  }

  public configToJsonForms() {
    return {
      type: AWS_TYPE,
      ...this.cfg,
    };
  }
}

export { AwsEngine };
