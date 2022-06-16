import superagent from 'superagent';
import { FusebitContext } from '../router';
import { IInstanceConnectorConfig } from '../ConnectorManager';

import { WebhookClient } from './WebhookClient';
import { IncomingWebhookClient } from './IncomingWebhookClient';

interface IToken {
  access_token: string;
  instance_url: string;
  params?: Record<string, string>;
}

export type Token = IToken & Record<string, string>;

export interface IFusebitCredentials {
  credentials: {
    access_token: string;
  };
  lookupKey: string;
  connectorId: string;
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

  public instantiateIncomingWebhook = async <T>(ctx: FusebitContext): Promise<IncomingWebhookClient> => {
    ctx.throw('Incoming Webhooks are not supported for this connector');
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
    // When a lookupKey is prefixed via sid, we can safely consider the key to be a sessionId.
    // sessions have a different token endpoint compared to standard install token endpoint.
    const tokenPath = `/api/${lookupKey.startsWith('sid-') ? 'session/' : ''}${lookupKey}/token`;
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
