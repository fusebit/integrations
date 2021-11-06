import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';

import { Webhook } from './Webhook';

class AtlassianClient {
  public fusebit: IFusebitCredentials;
  public webhook: Webhook;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.fusebit = fusebit;
    this.webhook = new Webhook(ctx, this);
  }

  public async getAccessibleResources(): Promise<IAtlassianAccessibleResources> {
    const response = await superagent
      .get('https://api.atlassian.com/oauth/token/accessible-resources')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  public async me(): Promise<IAtlassianMe> {
    const response = await superagent
      .get('https://api.atlassian.com/me')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  public makeApiClient(cloudId: string, token: string): IApiClient {
    const makeUrl = (cloudId: string, url: string) =>
      `https://api.atlassian.com/ex/${token}/${cloudId}/rest/api/3${url}`;

    const makeRequest = (verb: string) => async (url: string) =>
      (
        await (superagent as any)
          [verb](makeUrl(cloudId, url))
          .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`)
      ).body;

    const api: IApiClient = {
      get: makeRequest('get'),
      put: makeRequest('put'),
      post: makeRequest('post'),
      delete: makeRequest('delete'),
      head: makeRequest('head'),
      patch: makeRequest('patch'),
    };

    return api;
  }

  public jira(cloudId: string): IApiClient {
    return this.makeApiClient(cloudId, 'jira');
  }

  public confluence(cloudId: string): IApiClient {
    return this.makeApiClient(cloudId, 'confluence');
  }
}

export default class AtlassianProvider extends Internal.ProviderActivator<AtlassianClient> {
  /*
   * This function will create an authorized wrapper for a variety of Atlassian clients.
   */
  public async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AtlassianClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: AtlassianClient = new AtlassianClient(ctx, {
      credentials,
      lookupKey,
      connectorId: this.config.entityId,
    });

    return client;
  }
}

export { AtlassianClient, Webhook as AtlassianWebhook };
