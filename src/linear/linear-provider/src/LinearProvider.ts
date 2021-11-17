import { Internal } from '@fusebit-int/framework';
import { LinearClient as Client } from '@linear/sdk';
import LinearWebhook from './LinearWebhook';

type FusebitLinearClient = Client & { fusebit?: any };

export default class LinearProvider extends Internal.ProviderActivator<FusebitLinearClient> {
  /**
   * This function will create an authorized webhook SDK for PagerDuty.
   */
  public instantiateWebhook = async (ctx: Internal.Types.Context, lookupKey: string, installId: string) => {
    const client = await this.instantiate(ctx, lookupKey);
    return new LinearWebhook(ctx, lookupKey, installId, this.config, client);
  };

  /*
   * This function will create an authorized wrapper of the Linear SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitLinearClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitLinearClient = new Client({ accessToken: credentials.access_token });
    return client;
  }
}
