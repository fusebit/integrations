import { Internal } from '@fusebit-int/framework';
import { LinearClient as Client } from '@linear/sdk';

type FusebitLinearClient = Client & { fusebit?: any };

export default class LinearProvider extends Internal.ProviderActivator<FusebitLinearClient> {
  /*
   * This function will create an authorized wrapper of the Linear SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitLinearClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitLinearClient = new Client({ accessToken: credentials.access_token });
    client.fusebit = { credentials };
    return client;
  }
}
