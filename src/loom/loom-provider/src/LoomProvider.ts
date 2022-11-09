import { Internal } from '@fusebit-int/framework';
import { LoomClient as Client } from './LoomClient';

type FusebitLoomClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class LoomProvider extends Internal.Provider.Activator<FusebitLoomClient> {
  /*
   * This function will create an authorized wrapper of the Loom SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitLoomClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitLoomClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
