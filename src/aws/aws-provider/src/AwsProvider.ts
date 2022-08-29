import AWS from 'aws-sdk';
import { Internal } from '@fusebit-int/framework';
import FusebitAwsClient from './FusebitAwsClient';

export default class AwsProvider extends Internal.Provider.Activator<FusebitAwsClient> {
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitAwsClient> {
    const creds = await this.requestConnectorToken({ ctx, lookupKey });
    const AWS_ = new FusebitAwsClient(
      { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey, sessionToken: creds.sessionToken },
      creds
    );
    return AWS_;
  }
}
