import { Internal } from '@fusebit-int/framework';
import { AuthenticationProvider, Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { BotFrameworkAdapter } from 'botbuilder';

type FusebitMSTeamsClient = Client & { fusebit?: any; botFrameworkAdapter?: BotFrameworkAdapter };

class FusebitAuthenticationProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}
  public async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export default class MSTeamsProvider extends Internal.ProviderActivator<FusebitMSTeamsClient> {
  /*
   * This function will create an authorized wrapper of the MSTeams SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMSTeamsClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const clientOptions: ClientOptions = {
      authProvider: new FusebitAuthenticationProvider(credentials.access_token),
    };
    const client: FusebitMSTeamsClient = Client.initWithMiddleware(clientOptions);
    client.fusebit = { credentials };

    client.botFrameworkAdapter = new BotFrameworkAdapter({
      appId: credentials.client_id || '16a42606-f57e-444e-9a97-3d703d05f436',
      appPassword: credentials.client_secret || 'JwP7Q~7r6MZifK~7aU~r3-JsAgbehuoHybYqS',
    });

    return client;
  }
}
