import { Internal } from '@fusebit-int/framework';
import { Client } from '@microsoft/microsoft-graph-client';

type FusebitMicrosoftGraphClient = Client & { fusebit?: any };

export default class MicrosoftGraphProvider extends Internal.ProviderActivator<FusebitMicrosoftGraphClient> {
  /*
   * This function will create an authorized wrapper of the MicrosoftGraph SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMicrosoftGraphClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitMicrosoftGraphClient = Client.init({});
    client.fusebit = { credentials };
    return client;
  }
}
