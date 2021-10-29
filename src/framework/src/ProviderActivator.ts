import superagent from 'superagent';
import { FusebitContext } from './router';
import { IInstanceConnectorConfig } from './ConnectorManager';
import { Integration } from './client';

export default abstract class ProviderActivator<T, W extends Integration.Types.WebhookClient | undefined = undefined> {
  public abstract instantiate(ctx: FusebitContext, lookupKey: string, installId?: string): Promise<T>;
  instantiateWebhook?: W extends undefined
    ? never
    : (ctx: FusebitContext, lookupKey: string, installId: string) => Promise<W>;

  public config: IInstanceConnectorConfig;
  constructor(cfg: IInstanceConnectorConfig) {
    this.config = cfg;
  }

  /**
   * Request credentials to communicate with specified connector.
   * @returns Promise<string>
   */
  protected async requestConnectorToken({ ctx, lookupKey }: { ctx: FusebitContext; lookupKey: string }): Promise<any> {
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
