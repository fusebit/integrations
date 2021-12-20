import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

class BotApiClient extends Internal.Provider.ApiClient {
  protected addAuthorization = (request: superagent.Request) => request.set('Authorization', `Bot ${this.token}`);
}

class DiscordClient {
  public fusebit: Internal.Types.IFusebitCredentials;
  private baseUrl = 'https://discord.com/api';
  private ctx: Internal.Types.Context;
  private connectorId: string;

  /**
   * Use Discord API that requires a user token
   */
  public user!: Internal.Provider.ApiClient;

  /**
   * Use Discord API that requires a bot token (i.e fetching a guild, or a channel, or updating permissions on a user)
   */
  public bot!: Internal.Provider.ApiClient;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.ctx = ctx;
    this.fusebit = fusebit;
    this.connectorId = fusebit.connectorId;
  }

  async initialize() {
    this.bot = new BotApiClient((url: string) => `${this.baseUrl}/${url}`, this.connectorId, await this.getBotToken());
    this.user = new Internal.Provider.ApiClient(
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
