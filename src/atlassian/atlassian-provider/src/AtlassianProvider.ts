import { Internal } from '@fusebit-int/framework';
import superagent from 'superagent';

import { Webhook } from './Webhook';

interface IApiClient {
  get: (url: string) => Promise<any>;
  put: (url: string) => Promise<any>;
  post: (url: string) => Promise<any>;
  delete: (url: string) => Promise<any>;
  head: (url: string) => Promise<any>;
  patch: (url: string) => Promise<any>;
}

interface IFusebitCredentials {
  credentials: { access_token: string };
  lookupKey: string;
  connectorId: string;
}

interface IAtlassianMe {
  account_type: string;
  account_id: string;
  email: string;
  name: string;
  picture: string;
  account_status: string;
  nickname: string;
  zoneinfo: string;
  locale: string;
  extended_profile: Record<string, string>;
}

interface IAtlassianAccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

type IAtlassianAccessibleResources = IAtlassianAccessibleResource[];

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

  public makeApiClient(cloudId: string, token: string, suffix: string): IApiClient {
    const makeUrl = (cloudId: string, url: string) => `https://api.atlassian.com/ex/${token}/${cloudId}${suffix}${url}`;

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
    return this.makeApiClient(cloudId, 'jira', '/rest/api/3');
  }

  public confluence(cloudId: string): IApiClient {
    return this.makeApiClient(cloudId, 'confluence', '/rest/api');
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
