// microsoft-graph-client uses fetch
import 'isomorphic-fetch';
import superagent from 'superagent';
import prefix from 'superagent-prefix';
import { Internal } from '@fusebit-int/framework';
import { AuthenticationProvider, Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { BotFrameworkAdapter } from 'botbuilder';

type FusebitMicrosoftClient = {
  graphClient?: Client;
  botFrameworkAdapter: BotFrameworkAdapter;
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
    const { botFrameworkConfig } = ctx.req.body.data;
    const botFrameworkAdapter = new BotFrameworkAdapter({
      appId: botFrameworkConfig.clientId,
      appPassword: 'this-is-not-a-real-or-needed-secret',
    }) as any;

    botFrameworkAdapter.credentials.authenticationContext._cache._entries.push({
      _clientId: botFrameworkConfig.clientId,
      accessToken: botFrameworkConfig.accessToken,
      tokenType: 'Bearer',
      expiresIn: 99999,
      expiresOn: new Date(2999, 11, 30),
      resource: 'https://api.botframework.com',
      _authority: 'https://login.microsoftonline.com/botframework.com',
    });

    ctx.req.headers.authorization = botFrameworkConfig.botAuth;
    ctx.req.body = ctx.req.body.data.teamsEvent;

    if (!lookupKey) {
      return {
        botFrameworkAdapter,
      };
    }

    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const clientOptions: ClientOptions = {
      authProvider: new FusebitAuthenticationProvider(credentials.access_token),
    };

    const client: FusebitMicrosoftClient = {
      graphClient: Client.initWithMiddleware(clientOptions),
      botFrameworkAdapter,
      fusebit: { credentials },
    };

    return client;
  }
}
