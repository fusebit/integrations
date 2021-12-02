import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { AuthorizationType, IBotCheck, IDiscordMethods, IFusebitCredentials } from './Types';

class DiscordClient {
  public fusebit: IFusebitCredentials;
  private baseUrl = 'https://discord.com/api';
  private botCheck: IBotCheck;
  /**
   * Use discord API that requires a user token
   */
  public user: IDiscordMethods;
  /**
   * Use discord API that requires a bot token (i.e fetching a guild, or a channel, or updating permissions on a user)
   */
  public bot: IDiscordMethods;
  /**
   * Webhooks are a low-effort way to post messages to channels in Discord.
   * They do not require a bot user or authentication to use
   */
  public webhook: IDiscordMethods;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials, botCheck: IBotCheck) {
    this.fusebit = fusebit;
    this.botCheck = botCheck;
    this.bot = {
      /**
       * @description Perform a GET request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      get: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.GET, body);
      },
      /**
       * @description Perform a POST request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      post: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.POST, body);
      },
      /**
       * @description Perform a PUT request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      put: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.PUT, body);
      },
      /**
       * @description Perform a PATCH request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      patch: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.PATCH, body);
      },
      /**
       * @description Perform a OPTIONS request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      options: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.OPTIONS, body);
      },
      /**
       * @description Perform a HEAD request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      head: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.HEAD, body);
      },
      /**
       * @description Perform a DELETE request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      delete: async (resource: string, body: any): Promise<any> => {
        return this.requestBotResource(resource, Internal.ProviderActivator.HttpMethodType.DELETE, body);
      },
    };

    this.user = {
      /**
       * @description Perform a GET request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      get: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.GET, AuthorizationType.Bearer, body);
      },
      /**
       * @description Perform a POST request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      post: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.POST, AuthorizationType.Bearer, body);
      },
      /**
       * @description Perform a PUT request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      put: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.PUT, AuthorizationType.Bearer, body);
      },
      /**
       * @description Perform a PATCH request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      patch: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.PATCH, AuthorizationType.Bearer, body);
      },
      /**
       * @description Perform a OPTIONS request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      options: async (resource: string, body: any): Promise<any> => {
        return this.request(
          resource,
          Internal.ProviderActivator.HttpMethodType.OPTIONS,
          AuthorizationType.Bearer,
          body
        );
      },
      /**
       * @description Perform a HEAD request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      head: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.HEAD, AuthorizationType.Bearer, body);
      },
      /**
       * @description Perform a DELETE request to Discord's HTTPS/REST API using a bot token
       * Using a bot token gives you access to the entire discord API according to the permissions you
       * set to your bot, this requires adding bot scope to your connector.
       * Read more at {@link https://discord.com/developers/docs/reference}
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      delete: async (resource: string, body: any): Promise<any> => {
        return this.request(resource, Internal.ProviderActivator.HttpMethodType.DELETE, AuthorizationType.Bearer, body);
      },
    };

    this.webhook = {
      /**
       * @description Perform a GET request to Discord's HTTPS/REST Webhooks API
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      get: async (resource: string, body: any): Promise<any> => {
        return this.webhookRequest(resource, Internal.ProviderActivator.HttpMethodType.GET, body);
      },
      /**
       * @description Perform a POST request to Discord's HTTPS/REST Webhooks API
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      post: async (resource: string, body: any): Promise<any> => {
        return this.webhookRequest(resource, Internal.ProviderActivator.HttpMethodType.POST, body);
      },
      /**
       * @description Perform a PATCH request to Discord's HTTPS/REST Webhooks API
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      patch: async (resource: string, body: any): Promise<any> => {
        return this.webhookRequest(resource, Internal.ProviderActivator.HttpMethodType.PATCH, body);
      },
      /**
       * @description Perform a DELETE request to Discord's HTTPS/REST Webhooks API
       * @param {string} resource
       * @param {string} [body]
       * @returns Promise<any>
       */
      delete: async (resource: string, body: any): Promise<any> => {
        return this.webhookRequest(resource, Internal.ProviderActivator.HttpMethodType.DELETE, body);
      },
    };
  }

  /**
   * Perform a HTTP request to Discord's HTTPS/REST API using a bot token
   */
  private async requestBotResource(resource: string, method: string, body?: any): Promise<any> {
    if (!this.botCheck.hasBotScope) {
      throw new Error('Missing scope, ensure the Connector bot scope is added to your configuration');
    }
    if (!this.botCheck.botToken) {
      throw new Error(
        'Missing bot token, ensure the Connector has the Discord Application Bot Token added to your configuration'
      );
    }
    return this.request(resource, method, AuthorizationType.Bot, body);
  }

  private async request(
    resource: string,
    method: string,
    authorizationType: AuthorizationType,
    body?: any
  ): Promise<any> {
    const response = await (superagent as any)
      [method](`${this.baseUrl}/${resource}`)
      .send(body)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`)
      .set(
        'Authorization',
        `${authorizationType} ${
          authorizationType === AuthorizationType.Bot ? this.botCheck.botToken : this.fusebit.credentials.access_token
        }`
      );
    return response.body;
  }

  private async webhookRequest(webhookWithTokenUrl: string, method: string, body?: any): Promise<any> {
    const response = await (superagent as any)
      [method](webhookWithTokenUrl)
      .send(body)
      .set('User-Agent', `fusebit/${this.fusebit.connectorId}`);
    return response.body;
  }
}

export { DiscordClient };
