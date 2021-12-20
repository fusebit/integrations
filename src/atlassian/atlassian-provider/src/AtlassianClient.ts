import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { IAtlassianAccessibleResources, IAtlassianAccessibleResource, IAtlassianMe } from './Types';

class AtlassianClient {
  public fusebit: Internal.Types.IFusebitCredentials;

  constructor(ctx: Internal.Types.Context, fusebit: Internal.Types.IFusebitCredentials) {
    this.fusebit = fusebit;
  }

  public async getAccessibleResources(filterFor?: 'jira' | 'confluence'): Promise<IAtlassianAccessibleResources> {
    const response = await superagent
      .get('https://api.atlassian.com/oauth/token/accessible-resources')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);

    if (filterFor === 'jira') {
      return response.body.filter((cloud: IAtlassianAccessibleResource) =>
        cloud.scopes.find((scope) => scope.includes('jira'))
      );
    }

    if (filterFor === 'confluence') {
      return response.body.filter((cloud: IAtlassianAccessibleResource) =>
        cloud.scopes.find((scope) => scope.includes('confluence'))
      );
    }

    return response.body;
  }

  public async me(): Promise<IAtlassianMe> {
    const response = await superagent
      .get('https://api.atlassian.com/me')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  public makeApiClient(cloudId: string, token: string, path: string): Internal.Provider.ApiClient {
    return new Internal.Provider.ApiClient(
      (url: string) => `https://api.atlassian.com/ex/${token}/${cloudId}${path}${url}`,
      this.fusebit.connectorId,
      this.fusebit.credentials.access_token
    );
  }

  public jira(cloudId: string): Internal.Provider.ApiClient {
    return this.makeApiClient(cloudId, 'jira', '/rest/api/3');
  }

  public confluence(cloudId: string): Internal.Provider.ApiClient {
    return this.makeApiClient(cloudId, 'confluence', '/rest/api');
  }
}

export { AtlassianClient };
