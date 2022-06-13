import { Internal } from '@fusebit-int/framework';
import { ConstantContactClient as Client } from './ConstantContactClient';

type FusebitConstantContactClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class ConstantContactProvider extends Internal.Provider.Activator<FusebitConstantContactClient> {
  /*
   * This function will create an authorized wrapper of the ConstantContact SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitConstantContactClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitConstantContactClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
