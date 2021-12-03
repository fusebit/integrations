import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { AuthorizationType, IDiscordMethods, IFusebitCredentials, SuperAgentType, HttpMethodTypes } from './Types';

class DiscordClient {
  public fusebit: IFusebitCredentials;
  private baseUrl = 'https://discord.com/api';
  private ctx: Internal.Types.Context;
  private connectorId: string;
  /**
   * Use Discord API that requires a user token
   */
  public user: IDiscordMethods;
  /**
   * Use Discord API that requires a bot token (i.e fetching a guild, or a channel, or updating permissions on a user)
   */
  public bot: IDiscordMethods;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
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
      get: this.makeRequest('get', AuthorizationType.User),
      post: this.makeRequest('post', AuthorizationType.User),
      put: this.makeRequest('put', AuthorizationType.User),
      patch: this.makeRequest('patch', AuthorizationType.User),
      options: this.makeRequest('options', AuthorizationType.User),
      head: this.makeRequest('head', AuthorizationType.User),
      delete: this.makeRequest('delete', AuthorizationType.User),
    };
  }

  /**
   * Get configured Bot token from the connector
   */
  private async getBotToken(): Promise<string> {
    const path = '/api/bot-token';
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.connectorId}`;
    const response = await superagent
      .get(`${baseUrl}${path}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);
    return response.body.botToken;
  }

  private makeRequest = (method: HttpMethodTypes, authorizationType: AuthorizationType) => async (
    url: string,
    body?: any
  ) => {
    const token =
      authorizationType === AuthorizationType.Bot ? await this.getBotToken() : this.fusebit.credentials.access_token;
    const response = await (superagent as SuperAgentType)
      [method](`${this.baseUrl}/${url}`)
      .send(body)
      .set('User-Agent', `fusebit/${this.connectorId}`)
      .set('Authorization', `${authorizationType} ${token}`);
    return response.body;
  };
}

export { DiscordClient };
