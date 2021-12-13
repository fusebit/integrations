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
  public user!: Internal.Provider.HttpClient;

  /**
   * Use Discord API that requires a bot token (i.e fetching a guild, or a channel, or updating permissions on a user)
   */
  public bot!: Internal.Provider.HttpClient;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
  }

  async initialize() {
    this.bot = new Internal.Provider.HttpClient(
      (url: string) => `${this.baseUrl}/${url}`,
      this.connectorId,
      await this.getBotToken()
    );
    this.user = new Internal.Provider.HttpClient(
      (url: string) => `${this.baseUrl}/${url}`,
      this.connectorId,
      this.fusebit.credentials.access_token
    );
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
}

export { DiscordClient };
