import { Internal } from '@fusebit-int/framework';
import { Client } from '@hubspot/api-client';

type FusebitHubspotClient = Client & { fusebit?: any };

export default class HubspotProvider extends Internal.ProviderActivator<FusebitHubspotClient> {
  /*
   * This function will create an authorized wrapper of the HubSpot SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitHubspotClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const hubspotClient: FusebitHubspotClient = new Client({ accessToken: credentials.access_token });
    hubspotClient.fusebit = { credentials };
    return hubspotClient;
  }
}
