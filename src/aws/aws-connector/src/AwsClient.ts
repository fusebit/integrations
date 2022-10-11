import AWS from 'aws-sdk';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';

import { Internal } from '@fusebit-int/framework';

import { IAssumeRoleConfiguration, IAwsConfig } from './AwsTypes';

const MAX_AWS_SESS_DURATION = 3000;
const S3_BASE_URL = 's3.amazonaws.com';

interface assumeRoleResponse {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: number;
}

abstract class BaseAwsClient {
  abstract getIdentity(): Promise<string>;
  abstract assumeRole(cfg: IAssumeRoleConfiguration): Promise<assumeRoleResponse>;
  abstract putObject(cfnContent: string, sessionId: string): Promise<string>;
  abstract deleteObject(sessionId: string): Promise<void>;
}

class ProdAwsClient extends BaseAwsClient {
  constructor(private s3Client: AWS.S3, private stsClient: AWS.STS, private globalCfg: IAwsConfig) {
    super();
  }

  public async getIdentity(): Promise<string> {
    const me = await this.stsClient.getCallerIdentity().promise();
    return me.Account as string;
  }

  public async assumeRole(cfg: IAssumeRoleConfiguration): Promise<assumeRoleResponse> {
    const totpToken = authenticator.generate(this.globalCfg.IAM?.otpSecret);
    const duration = Math.max(MAX_AWS_SESS_DURATION, parseInt(this.globalCfg.IAM?.timeout || '0'));
    const response = await this.stsClient
      .assumeRole({
        ExternalId: cfg.externalId,
        RoleSessionName: uuidv4(),
        RoleArn: cfg.roleArn,
        TokenCode: totpToken,
        DurationSeconds: duration,
        SerialNumber: this.globalCfg.IAM?.mfaSerial,
      })
      .promise();

    return {
      accessKeyId: response.Credentials?.AccessKeyId as string,
      secretAccessKey: response.Credentials?.SecretAccessKey as string,
      sessionToken: response.Credentials?.SessionToken as string,
      expiration: response.Credentials?.Expiration.getTime() as number,
    };
  }

  public async putObject(cfnContent: string, sessionId: string): Promise<string> {
    await this.s3Client
      .putObject({
        Bucket: this.globalCfg.bucketName,
        Body: Buffer.from(cfnContent),
        ContentType: 'text/plain',
        Key: `${this.globalCfg.bucketPrefix}/${sessionId}`,
      })
      .promise();

    return `https://${S3_BASE_URL}/${this.globalCfg.bucketName}/${this.globalCfg.bucketPrefix}/${sessionId}`;
  }

  public async deleteObject(sessionId: string) {
    await this.s3Client
      .deleteObject({
        Bucket: this.globalCfg.bucketName,
        Key: `${this.globalCfg.bucketPrefix}/${sessionId}`,
      })
      .promise();
  }
}

class ProxyAwsClient extends BaseAwsClient {
  constructor(private ctx: Internal.Types.Context, private globalCfg: IAwsConfig) {
    super();
  }

  public async getIdentity(): Promise<string> {
    const response = await superagent.post(`${this.ctx.state.params.baseUrl}/proxy/aws/action`).send({
      action: 'STS.GetCallerIdentity',
    });
    return response.body.accountId;
  }

  public async assumeRole(cfg: IAssumeRoleConfiguration): Promise<assumeRoleResponse> {
    const duration = Math.max(MAX_AWS_SESS_DURATION, parseInt(this.globalCfg.IAM?.timeout || '0'));
    const response = await superagent.post(`${this.ctx.state.params.baseUrl}/proxy/aws/action`).send({
      action: 'STS.AssumeRole',
      externalId: cfg.externalId,
      roleArn: cfg.roleArn,
      durationSeconds: duration,
    });

    const body = response.body;
    body.expiration = new Date(body.expiration);
    return body;
  }

  public async putObject(cfnContent: string, sessionId: string): Promise<string> {
    const response = await superagent
      .post(`${this.ctx.state.params.baseUrl}/proxy/aws/action`)
      .send({ action: 'S3.PutObject', sessionId, body: cfnContent });

    return response.body.s3Url;
  }

  public async deleteObject(sessionId: string) {
    await superagent
      .post(`${this.ctx.state.params.baseUrl}/proxy/aws/action`)
      .send({ action: 'S3.DeleteObject', sessionId });
  }
}

export { BaseAwsClient, ProdAwsClient, ProxyAwsClient };
