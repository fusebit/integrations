// microsoft-graph-client uses fetch
import 'isomorphic-fetch';
import superagent from 'superagent';
import prefix from 'superagent-prefix';
import { Internal } from '@fusebit-int/framework';
import { AuthenticationProvider, Client, ClientOptions } from '@microsoft/microsoft-graph-client';

type FusebitMicrosoftClient = {
  graphClient?: Client;
  botClient: superagent.SuperAgentStatic & superagent.Request;
  fusebit?: any;
};

class FusebitAuthenticationProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}
  public async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export default class MicrosoftTeamsProvider extends Internal.ProviderActivator<FusebitMicrosoftClient> {
  /*
   * This function will create a HTTP client for the API so the bot can communicate with it and, if there is
   * an authorized user in this context, a wrapper around the Microsoft Graph SDK.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey?: string): Promise<FusebitMicrosoftClient> {
    const botAccessToken = ctx.req.body.data.botFrameworkConfig.authorization.split(' ')[1];
    const botHost = ctx.req.body.data.botFrameworkConfig.host;
    const botClient = superagent.agent().auth(botAccessToken, { type: 'bearer' }).use(prefix(botHost));

    if (!lookupKey) {
      return {
        botClient,
      };
    }

    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const clientOptions: ClientOptions = {
      authProvider: new FusebitAuthenticationProvider(credentials.access_token),
    };

    const client: FusebitMicrosoftClient = {
      graphClient: Client.initWithMiddleware(clientOptions),
      botClient,
      fusebit: { credentials },
    };

    return client;
  }
}
