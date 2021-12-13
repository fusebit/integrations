import superagent from 'superagent';
import { FusebitContext } from './router';
import { IInstanceConnectorConfig } from './ConnectorManager';
import { HttpMethodTypes } from '../../discord/discord-provider/src/Types';

export abstract class WebhookClient<C = any> {
  abstract create: (...args: any[]) => Promise<any>;
  abstract get: (...args: any[]) => Promise<any>;
  abstract list: (...args: any[]) => Promise<any>;
  abstract delete: (...args: any[]) => Promise<any>;
  abstract deleteAll: (...args: any[]) => Promise<any>;

  constructor(ctx: FusebitContext, lookupKey: string, installId: string, config: IInstanceConnectorConfig, client: C) {
    this.ctx = ctx;
    this.client = client;
    this.config = config;
    this.lookupKey = lookupKey;
    this.installId = installId;
  }
  protected ctx: FusebitContext;
  protected lookupKey: string;
  protected installId: string;
  protected config: IInstanceConnectorConfig;
  protected client: C;
}

export interface Token {
  access_token: string;
  instance_url: string;
}

export abstract class ApiClient {
  baseUrl = 'www.serviceurl.com';
  bearerToken?: string;

  // add additional constructor args in sub-class as needed
  // for atlassian, this would include the `token` and setting `this.baseUrl` using such
  protected constructor(options: {bearerToken: string}) {
    this.bearerToken = options.bearerToken;
  }

  get: (path: string) => this.makeRequest('GET', path);
  post: (path: string, body: Record<string, any>) => this.makeRequest('POST', path, body);

  async makeRequest(method: HttpMethodTypes, path: string, body: Record<string, any>) {
    const request = superagent[method](this.baseUrl);
    return await this.authenticate(request).send(body);
  }

  // override in sub-class with differing
  authenticate(request: superagent.Request) {
    return request.set('authorization', `Bearer ${this.bearerToken}`);
  }

}

export default abstract class ProviderActivator<T> {
  public abstract instantiate(ctx: FusebitContext, lookupKey?: string, installId?: string): Promise<T>;
  public instantiateWebhook = async (
    ctx: FusebitContext,
    lookupKey: string,
    installId: string
  ): Promise<WebhookClient> => {
    ctx.throw('Dynamic Webhooks are not supported for this connector');
  };

  public config: IInstanceConnectorConfig;
  constructor(cfg: IInstanceConnectorConfig) {
    this.config = cfg;
  }

  /**
   * Request credentials to communicate with specified connector.
   * @returns Promise<Token>
   */
  protected async requestConnectorToken({
    ctx,
    lookupKey,
  }: {
    ctx: FusebitContext;
    lookupKey: string;
  }): Promise<Token> {
    const tokenPath = `/api/${lookupKey}/token`;
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}`;
    const tokenResponse = await superagent
      .get(`${baseUrl}${tokenPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);

    const connectorToken = tokenResponse.body;
    const isEmpty = !connectorToken || Object.keys(connectorToken).length === 0;

    if (isEmpty) {
      ctx.throw(404, `Cannot find Integration Identity '${lookupKey}'. Has the tenant authorized this integration?`);
    }

    return connectorToken;
  }
}
