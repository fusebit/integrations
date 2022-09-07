import { Internal } from '@fusebit-int/framework';
import AwsCredentials from './types';

export default class AwsProvider extends Internal.Provider.Activator<AwsCredentials> {
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AwsCredentials> {
    const creds = (await this.requestConnectorToken({ ctx, lookupKey })) as unknown;
    return creds as AwsCredentials;
  }
}
