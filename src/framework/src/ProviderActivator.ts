import superagent from 'superagent';
import { Context } from './Router';
import { IInstanceConnectorConfig } from './ConnectorManager';

export default abstract class ProviderActivator<T> {
  protected abstract instantiate(ctx: Context, lookupKey: string): Promise<T>;

  public config: IInstanceConnectorConfig;
  constructor(cfg: IInstanceConnectorConfig) {
    this.config = cfg;
  }

  /**
   * Request credentials to communicate with specified connector.
   * @returns Promise<string>
   */
  protected async requestConnectorToken({ ctx, lookupKey }: { ctx: Context; lookupKey: string }): Promise<any> {
    const tokenPath = `/api/${lookupKey}/token`;
    const params = ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.config.entityId}`;
    const tokenResponse = await superagent
      .get(`${baseUrl}${tokenPath}`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`);

    const connectorToken = tokenResponse.body;
    const isEmpty = !connectorToken || Object.keys(connectorToken).length === 0;

    if (isEmpty) {
      ctx.throw(404, `Cannot find Integration Instance ${lookupKey}. Has the tenant authorized this integration?`);
    }

    return connectorToken;
  }
}
