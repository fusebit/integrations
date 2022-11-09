import { Internal } from '@fusebit-int/framework';
import { ClearbitClient as Client } from './ClearbitClient';

type FusebitClearbitClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class ClearbitProvider extends Internal.Provider.Activator<FusebitClearbitClient> {
  /*
   * This function will create an authorized wrapper of the Clearbit SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitClearbitClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitClearbitClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });

    return client;
  }
}
