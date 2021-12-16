import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { BotFrameworkAdapter, TurnContext, WebRequest, WebResponse } from 'botbuilder';

type FusebitBotFrameworkAdapter = BotFrameworkAdapter & { fusebit?: any };

interface MicrosoftBotProviderCredentials {
  accessToken: string;
  botClientId: string;
}

interface Claim {
  type: string;
  value: string | number;
}

class ClaimsIdentity {
  constructor(private claims: Claim[], private authenticationType?: string | boolean) {}

  public get isAuthenticated(): boolean {
    if (typeof this.authenticationType === 'boolean') {
      return this.authenticationType;
    }

    return this.authenticationType != null;
  }

  public getClaimValue(claimType: string): string | number | null {
    const claim = this.claims.find((c) => c.type === claimType);

    return claim?.value ?? null;
  }
}

export default class MicrosoftBotProvider extends Internal.Provider.Activator<FusebitBotFrameworkAdapter> {
  protected async requestConnectorCredentials({
    ctx,
  }: {
    ctx: Internal.Types.Context;
  }): Promise<MicrosoftBotProviderCredentials> {
    const tokenPath = '/api/credentials';
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}`;
    const tokenResponse = await superagent
      .get(`${baseUrl}${tokenPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);

    const credentials = tokenResponse.body;
    const isEmpty = !credentials || Object.keys(credentials).length === 0;

    if (isEmpty) {
      ctx.throw(404, 'Cannot fetch the credentials for this connector.');
    }

    return credentials;
  }

  /*
   * This function will create an authorized wrapper of the BotFrameworkAdapter client.
   */
  public async instantiate(ctx: Internal.Types.Context): Promise<FusebitBotFrameworkAdapter> {
    const credentials = await this.requestConnectorCredentials({ ctx });

    const botFrameworkAdapter = new BotFrameworkAdapter({
      appId: credentials.botClientId,
      appPassword: 'this-is-not-a-real-or-needed-secret-as-we-bypass-it',
    }) as FusebitBotFrameworkAdapter;

    // The following logic injects an entry on the authentication context of the SDK
    // so we can hide the bot client secret from the integration.
    const botFrameworkAdapterBypass = botFrameworkAdapter as any;

    // SDK raises errors if it finds more than one token per client, so we need to avoid that.
    const accessTokens = botFrameworkAdapterBypass.credentials.authenticationContext._cache._entries;
    const accessTokenConfigured = accessTokens.some((entry: any) => entry._clientId === credentials.botClientId);
    if (!accessTokenConfigured) {
      accessTokens.push({
        _clientId: credentials.botClientId,
        accessToken: credentials.accessToken,
        expiresOn: new Date(2999, 11, 30),
        resource: 'https://api.botframework.com',
        _authority: 'https://login.microsoftonline.com/botframework.com',
      });
    }

    // This is a small workaround to make the SDK ignore the fact that it is not getting
    // the security access token that it uses to validate that events are really being sent
    // by the Bot Framework service itself. We already handle that verification on the
    // validateWebhookEvent method of the connector service.
    botFrameworkAdapterBypass.authenticateRequestInternal = (): Promise<ClaimsIdentity> => {
      const claims: Claim[] = [
        { type: 'serviceurl', value: 'https://smba.trafficmanager.net' },
        { type: 'nbf', value: 0 },
        { type: 'exp', value: 9999999999 },
        { type: 'iss', value: 'https://api.botframework.com' },
        { type: 'aud', value: credentials.botClientId },
      ];
      return Promise.resolve(new ClaimsIdentity(claims, true));
    };

    // The original processActivity method of the botFrameworkAdapter expects the body to contain
    // the original event sent by the Bot Framework service. So, we wrap the original processActivity
    // method to be able to change the request body before the SDK uses it. Also, after the SDK is
    // done with that, we revert the body back to what the provider got (that is, a body with
    // Fusebit properties) so Daisy never knows what happened.
    const originalProcessActivity = botFrameworkAdapter.processActivity.bind(botFrameworkAdapter);
    botFrameworkAdapter.processActivity = async (
      req: WebRequest,
      res: WebResponse,
      logic: (context: TurnContext) => Promise<any>
    ): Promise<void> => {
      const originalBody = req.body;
      req.body = originalBody.data;

      // We also wrap the original logic method to do the same req.body magic as on the original
      // processActivity method. That makes sure the original logic method gets the same body as the
      // integration (i.e., with Fusebit properties).
      const originalLogic = logic.bind(logic);
      const wrappedLogic = async (context: TurnContext) => {
        req.body = originalBody;
        return originalLogic(context);
      };

      await originalProcessActivity(req, res, wrappedLogic);

      req.body = originalBody;
    };

    return botFrameworkAdapter;
  }
}
