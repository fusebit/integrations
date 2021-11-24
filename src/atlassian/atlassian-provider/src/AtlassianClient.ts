import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { IApiClient, IAtlassianAccessibleResources, IAtlassianMe, IFusebitCredentials } from './Types';

class AtlassianClient {
  public fusebit: IFusebitCredentials;

  constructor(ctx: Internal.Types.Context, fusebit: IFusebitCredentials) {
    this.fusebit = fusebit;
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

export { AtlassianClient };
