import superagent from 'superagent';
import { FusebitContext } from './router';
import { IInstanceConnectorConfig } from './ConnectorManager';

export abstract class WebhookClient<T> {
  abstract create: (...args: any[]) => Promise<T | void>;
  abstract get: (...args: any[]) => Promise<T>;
  abstract list: (...args: any[]) => Promise<any>;
  abstract delete: (...args: any[]) => Promise<void>;
  abstract deleteAll: (...args: any[]) => Promise<void>;
}

export interface Token {
  access_token: string;
  instance_url: string;
}

export default abstract class ProviderActivator<T> {
  public abstract instantiate(ctx: FusebitContext, lookupKey: string, installId?: string): Promise<T>;
  public instantiateWebhook = async (
    ctx: FusebitContext,
    lookupKey: string,
    installId: string
  ): Promise<WebhookClient<any>> => {
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
      ctx.throw(404, `Cannot find Integration Install '${lookupKey}'. Has the tenant authorized this integration?`);
    }

    return connectorToken;
  }
}
