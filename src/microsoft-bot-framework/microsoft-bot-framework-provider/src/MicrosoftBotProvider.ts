import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { Activity, BotFrameworkAdapter } from 'botbuilder';

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

export default class MicrosoftBotProvider extends Internal.ProviderActivator<FusebitBotFrameworkAdapter> {
  protected async requestConnectorCredentials({
    ctx,
  }: {
    ctx: Internal.Types.Context;
  }): Promise<MicrosoftBotProviderCredentials> {
    const tokenPath = `/api/credentials`;
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}`;
    const tokenResponse = await superagent
      .get(`${baseUrl}${tokenPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);

    const credentials = tokenResponse.body;
    const isEmpty = !credentials || Object.keys(credentials).length === 0;

    if (isEmpty) {
      ctx.throw(404, `Cannot fetch the credentials for this connector.`);
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

    const botFrameworkAdapterBypass = botFrameworkAdapter as any;
    botFrameworkAdapterBypass.credentials.authenticationContext._cache._entries.push({
      _clientId: credentials.botClientId,
      accessToken: credentials.accessToken,
      expiresOn: new Date(2999, 11, 30),
      resource: 'https://api.botframework.com',
      _authority: 'https://login.microsoftonline.com/botframework.com',
    });

    botFrameworkAdapterBypass.authenticateRequestInternal = (): Promise<ClaimsIdentity> => {
      const claims: Claim[] = [
        { type: 'serviceurl', value: 'https://smba.trafficmanager.net' },
        { type: 'nbf', value: 9999999999 },
        { type: 'exp', value: 9999999999 },
        { type: 'iss', value: 'https://api.botframework.com' },
        { type: 'aud', value: credentials.botClientId },
      ];
      return Promise.resolve(new ClaimsIdentity(claims, true));
    };

    return botFrameworkAdapter;
  }
}
