import AWS from 'aws-sdk';
import { Internal } from '@fusebit-int/framework';

type FusebitAwsClient = typeof AWS & { fusebit?: any };

export default class AwsProvider extends Internal.Provider.Activator<FusebitAwsClient> {
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitAwsClient> {
    const creds = await this.requestConnectorToken({ ctx, lookupKey });
    const AWS_: FusebitAwsClient = AWS;
    AWS_.config.accessKeyId = creds.accessKeyId;
    AWS_.config.secretAccessKey = creds.secretAccessKey;
    AWS_.config.sessionToken = creds.sessionToken;
    AWS_.fusebit = creds;
    return AWS_;
  }
}
