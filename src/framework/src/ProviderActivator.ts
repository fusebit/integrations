import superagent from 'superagent';
import { FusebitContext } from './router';
import { IInstanceConnectorConfig } from './ConnectorManager';

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

export abstract class ProviderActivator<T> {
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

  /**
   * Provide access to connector defined endpoints
   * @returns Promise<any>
   */
  protected async requestConnectorAPI({
    ctx,
    path,
    method,
  }: {
    ctx: FusebitContext;
    path: string;
    method: ProviderActivator.HttpMethodType;
  }): Promise<any> {
    const connnectorPath = `/api/${path}`;
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}`;
    const response = await superagent[method](`${baseUrl}${connnectorPath}`).set(
      'Authorization',
      `Bearer ${params.functionAccessToken}`
    );
    return response.body;
  }
}

export namespace ProviderActivator {
  export enum HttpMethodType {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    HEAD = 'head',
    DELETE = 'delete',
    OPTIONS = 'options',
  }
}

export default ProviderActivator;
