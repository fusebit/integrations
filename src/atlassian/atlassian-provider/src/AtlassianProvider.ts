import { Internal } from '@fusebit-int/framework';
import { AtlassianWebhook } from './AtlassianWebhook';
import { AtlassianClient } from './AtlassianClient';

export default class AtlassianProvider extends Internal.Provider.Activator<AtlassianClient> {
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new AtlassianWebhook(ctx, lookupKey, installId, this.config, client);
  };
  /*
   * This function will create an authorized wrapper for a variety of Atlassian clients.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AtlassianClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: AtlassianClient = new AtlassianClient(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });

    return client;
  }
}

export { AtlassianClient, AtlassianWebhook };
