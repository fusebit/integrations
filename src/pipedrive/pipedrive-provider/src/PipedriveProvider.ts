import { Internal } from '@fusebit-int/framework';
import { PipedriveWebhook } from './PipedriveWebhook';

type FusebitPipedriveClient = Internal.Provider.ApiClient & { fusebit?: any };

export default class PipedriveProvider extends Internal.Provider.Activator<FusebitPipedriveClient> {
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new PipedriveWebhook(ctx, lookupKey, installId, this.config, client);
  };

  /*
   * This function will create an authorized wrapper of the Pipedrive SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitPipedriveClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitPipedriveClient = new Internal.Provider.ApiClient(
      (url: string) => `https://api.pipedrive.com${url}`,
      this.config.entityId,
      credentials.access_token
    );
    client.fusebit = {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    };
    return client;
  }
}
