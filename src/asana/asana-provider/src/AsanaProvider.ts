import { Internal } from '@fusebit-int/framework';
import Asana from 'asana';
import AsanaWebhook from './AsanaWebhook';
import { FusebitAsanaClient } from './types';

export default class AsanaProvider extends Internal.ProviderActivator<FusebitAsanaClient, AsanaWebhook> {
  public instantiateWebhook = async (
    ctx: Internal.Types.Context,
    lookupKey: string,
    installId: string
  ): Promise<AsanaWebhook> => {
      const client = await this.instantiate(ctx, lookupKey);
      return new AsanaWebhook(ctx, lookupKey, installId, this.config, client);
  }
  /*
   * This function will create an authorized wrapper of the Asana SDK client.
   */
  public async instantiate(
    ctx: Internal.Types.Context,
    lookupKey: string
  ): Promise<FusebitAsanaClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitAsanaClient = Asana.Client.create().useAccessToken(credentials.access_token);
    client.fusebit = { credentials };
    return client;
  }
}
