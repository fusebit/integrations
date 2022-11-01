import { Internal } from '@fusebit-int/framework';
import { DriftClient as Client } from './DriftClient';

type FusebitDriftClient = Client & { fusebit?: Internal.Types.IFusebitCredentials };

export default class DriftProvider extends Internal.Provider.Activator<FusebitDriftClient> {
  /*
   * This function will create an authorized wrapper of the Drift SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitDriftClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitDriftClient = new Client(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }
}
