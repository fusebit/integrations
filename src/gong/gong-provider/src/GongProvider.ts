import { Internal } from '@fusebit-int/framework';
import { GongClient as Client } from './GongClient';

type FusebitGongClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class GongProvider extends Internal.Provider.Activator<FusebitGongClient> {
  /*
   * This function will create an authorized wrapper of the Gong SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitGongClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitGongClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
