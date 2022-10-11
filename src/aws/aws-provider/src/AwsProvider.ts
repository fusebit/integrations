import { Internal } from '@fusebit-int/framework';
import AwsCredentials from './types';

export default class AwsProvider extends Internal.Provider.Activator<AwsCredentials> {
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AwsCredentials> {
    const credentials = (await this.requestConnectorToken({ ctx, lookupKey })) as unknown;
    return { credentials } as AwsCredentials;
  }
}
