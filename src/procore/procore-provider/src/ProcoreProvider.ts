import { Internal } from '@fusebit-int/framework';
import { ProcoreClient as Client } from './ProcoreClient';

type FusebitProcoreClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class ProcoreProvider extends Internal.Provider.Activator<FusebitProcoreClient> {
  /*
   * This function will create an authorized wrapper of the Procore SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitProcoreClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitProcoreClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
