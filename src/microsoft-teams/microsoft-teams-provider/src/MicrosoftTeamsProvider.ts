import { Internal } from '@fusebit-int/framework';
import { AuthenticationProvider, Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { BotFrameworkAdapter } from 'botbuilder';

type FusebitMicrosoftTeamsClient = Client & { fusebit?: any; botFrameworkAdapter?: BotFrameworkAdapter };

class FusebitAuthenticationProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}
  public async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export default class MicrosoftTeamsProvider extends Internal.ProviderActivator<FusebitMicrosoftTeamsClient> {
  /*
   * This function will create an authorized wrapper of the MicrosoftTeams SDK client.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitMicrosoftTeamsClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const clientOptions: ClientOptions = {
      authProvider: new FusebitAuthenticationProvider(credentials.access_token),
    };
    const client: FusebitMicrosoftTeamsClient = Client.initWithMiddleware(clientOptions);
    client.fusebit = { credentials };

    client.botFrameworkAdapter = new BotFrameworkAdapter({
      appId: credentials.client_id,
      appPassword: credentials.client_secret,
    });

    return client;
  }
}
