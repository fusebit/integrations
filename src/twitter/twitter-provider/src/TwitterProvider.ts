import { Internal } from '@fusebit-int/framework';
import Client from 'twitter-api-v2';

type FusebitTwitterClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class TwitterProvider extends Internal.Provider.Activator<FusebitTwitterClient> {
  /*
   * This function will create an authorized wrapper of the Twitter SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitTwitterClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitTwitterClient = new Client(credentials.access_token);
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
