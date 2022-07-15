import { Internal } from '@fusebit-int/framework';
import { BambooHRClient } from './BambooHRClient';
import BambooHRWebhook from './BambooHRWebhook';

type FusebitBambooHRClient = BambooHRClient & { fusebit?: Internal.Types.IFusebitCredentials };

export default class BambooHRProvider extends Internal.Provider.Activator<FusebitBambooHRClient> {
  /*
   * This function will create an authorized wrapper of the BambooHR SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitBambooHRClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitBambooHRClient = new BambooHRClient(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });
    return client;
  }

  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new BambooHRWebhook(ctx, lookupKey, installId, this.config, client);
  };
}
