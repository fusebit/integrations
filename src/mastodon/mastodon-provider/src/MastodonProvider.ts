import { Internal } from '@fusebit-int/framework';
import { MastodonClient as Client } from './MastodonClient';

type FusebitMastodonClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class MastodonProvider extends Internal.Provider.Activator<FusebitMastodonClient> {
  /*
   * This function will create an authorized wrapper of the Mastodon SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMastodonClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitMastodonClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
