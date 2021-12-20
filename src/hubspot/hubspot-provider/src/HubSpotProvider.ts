import { Internal } from '@fusebit-int/framework';
import { Client } from '@hubspot/api-client';

type FusebitHubSpotClient = Client & { fusebit?: any };

export default class HubSpotProvider extends Internal.Provider.Activator<FusebitHubSpotClient> {
  /*
   * This function will create an authorized wrapper of the HubSpot SDK client.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitHubSpotClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const hubspotClient: FusebitHubSpotClient = new Client({ accessToken: credentials.access_token });
    hubspotClient.fusebit = { credentials };
    return hubspotClient;
  }
}
