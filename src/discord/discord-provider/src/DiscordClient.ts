import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { AuthorizationType, IBotCheck, IDiscordMethods, IFusebitCredentials } from './Types';

class DiscordClient {
  public fusebit: IFusebitCredentials;
  private baseUrl = 'https://discord.com/api';
  private ctx: Internal.Types.Context;
  /**
   * Use discord API that requires a user token
   */
  public user: IDiscordMethods;
  /**
   * Use discord API that requires a bot token (i.e fetching a guild, or a channel, or updating permissions on a user)
   */
  public bot: IDiscordMethods;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.bot = {
      get: this.makeRequest('get', AuthorizationType.Bot),
      post: this.makeRequest('post', AuthorizationType.Bot),
      put: this.makeRequest('put', AuthorizationType.Bot),
      patch: this.makeRequest('patch', AuthorizationType.Bot),
      options: this.makeRequest('options', AuthorizationType.Bot),
      head: this.makeRequest('head', AuthorizationType.Bot),
      delete: this.makeRequest('delete', AuthorizationType.Bot),
    };

    this.user = {
      get: this.makeRequest('get', AuthorizationType.Bearer),
      post: this.makeRequest('post', AuthorizationType.Bearer),
      put: this.makeRequest('put', AuthorizationType.Bearer),
      patch: this.makeRequest('patch', AuthorizationType.Bearer),
      options: this.makeRequest('options', AuthorizationType.Bearer),
      head: this.makeRequest('head', AuthorizationType.Bearer),
      delete: this.makeRequest('delete', AuthorizationType.Bearer),
    };
  }

  /**
   * Checks for a configured Bot token
   */
  private async executeBotCheck(): Promise<IBotCheck> {
    const path = '/api/bot/check';
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.fusebit.connectorId}`;
    const response = await superagent
      .get(`${baseUrl}${path}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);
    return response.body;
  }

  private makeRequest = (method: string, authorizationType: AuthorizationType) => async (url: string, body?: any) => {
    const token = this.fusebit.credentials.access_token;
    if (authorizationType === AuthorizationType.Bot) {
      const { hasBotScope, botToken: token } = await this.executeBotCheck();
      if (!hasBotScope) {
        throw new Error('Missing scope, ensure the Connector bot scope is added to your configuration');
      }
      if (!token) {
        throw new Error(
          'Missing bot token, ensure the Connector has the Discord Application Bot Token added to your configuration'
        );
      }
    }
    const response = await (superagent as any)
      [method](`${this.baseUrl}/${url}`)
      .send(body)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `${authorizationType} ${token}`);
    return response.body;
  };
}

export { DiscordClient };
