import { Internal } from '@fusebit-int/framework';
import JiraClient from 'jira-client';
import superagent from 'superagent';

interface IFusebitCredentials {
  credentials: { access_token: string };
}
class FusebitAtlassianClient {
  public fusebit: IFusebitCredentials;

  constructor(fusebit: IFusebitCredentials) {
    this.fusebit = fusebit;
  }
  public getAccessibleResources(): Promise<superagent.Response> {
    return superagent
      .get('https://api.atlassian.com/oauth/token/accessible-resources')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
  }

  public jira(...options: any): JiraClient {
    return new JiraClient({ ...options, bearer: this.fusebit.credentials.access_token });
  }
}

export default class AtlassianProvider extends Internal.ProviderActivator<FusebitAtlassianClient> {
  /*
   * This function will create an authorized wrapper for a variety of Atlassian clients.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<FusebitAtlassianClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: FusebitAtlassianClient = new FusebitAtlassianClient({ credentials });
    return client;
  }
}
