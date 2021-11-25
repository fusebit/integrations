import { Internal } from '@fusebit-int/framework';
import { DiscordClient as Client } from './DiscordClient';

type FusebitDiscordClient = Client & { fusebit?: any };

export default class DiscordProvider extends Internal.ProviderActivator<FusebitDiscordClient> {
  /*
   * This function will create an authorized wrapper of the Discord SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitDiscordClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitDiscordClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    client.fusebit = { credentials };
    return client;
  }
}
