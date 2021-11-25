import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import {
  HttpMethodType,
  IDiscordApplication,
  IDiscordAuthorizationInfo,
  IDiscordChannel,
  IDiscordUser,
  IFusebitCredentials,
} from './Types';

class DiscordClient {
  public fusebit: IFusebitCredentials;
  private baseUrl: string = 'https://discord.com/api';

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.fusebit = fusebit;
  }

  /**
   * @description Returns info about the current authorization.
   * @returns Promise<IDiscordAuthorizationInfo>
   */
  public async getCurrentAuthorizationInfo(): Promise<IDiscordAuthorizationInfo> {
    const response = await superagent
      .get(`${this.baseUrl}/oauth2/@me`)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description Returns the bot's application object.
   * @returns Promise<IDiscordApplication>
   */
  public async getCurrentBotApplicationInfo(): Promise<IDiscordApplication> {
    const response = await superagent
      .get(`${this.baseUrl}/oauth2/applications/@me`)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description Returns the user object of the requester's account.
   * For OAuth2, this requires the identify scope, which will return the object without an email
   * and optionally the email scope, which returns the object with an email.
   * @returns Promise<IDiscordUser>
   */
  public async getCurrentUser(): Promise<IDiscordUser> {
    const response = await superagent
      .get(`${this.baseUrl}/users/@me`)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description  Returns an user object for a given user ID.
   * @returns Promise<IDiscordUser>
   */
  public async getUser(userId: string): Promise<IDiscordUser> {
    const response = await superagent
      .get(`${this.baseUrl}/users/${userId}`)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description Create a new DM channel with a user.
   * You should not use this endpoint to DM everyone in a server about something.
   * DMs should generally be initiated by a user action.
   * If you open a significant amount of DMs too quickly, your bot may be rate limited or blocked from opening new ones.
   * @returns Promise<IDiscordChannel>
   *
   */

  public async createDM(recipient_id: string): Promise<IDiscordChannel> {
    const response = await superagent
      .post(`${this.baseUrl}/users/@me/channels`)
      .send({
        recipient_id,
      })
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description Provides access to Discord's HTTPS/REST API for general operations
   * Using user access token, for more powerful operations use a Bot token.
   * Read more at {@link https://discord.com/developers/docs/reference}
   * @param {string} resource
   * @enum {string} method Valid values: get,post,put,patch,head,delete,options
   * @param body
   * @returns
   */
  public async requestUserResource(resource: string, method: HttpMethodType, body?: any): Promise<any> {
    const response = await superagent[method](`${this.baseUrl}/${resource}`)
      .send(body)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  /**
   * @description Provides access to Discord's HTTPS/REST API using a bot token
   * Using a bot token gives you access to the entire discord API according to the permissions you
   * set to your bot, this requires adding bot scope to your connector.
   * Read more at {@link https://discord.com/developers/docs/reference}
   * @param {string} resource
   * @enum {string} method Valid values: get,post,put,patch,head,delete,options
   * @param body
   * @returns
   */
  public async requestResource(resource: string, method: HttpMethodType, body?: any): Promise<any> {
    const response = await superagent[method](`${this.baseUrl}/${resource}`)
      .send(body)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set('Authorization', `Bot ${this.fusebit.credentials.access_token}`); // TODO: This needs to be botToken
    return response.body;
  }
}

export { DiscordClient };
