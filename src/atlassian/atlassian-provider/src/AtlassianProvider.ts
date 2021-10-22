import { Internal } from '@fusebit-int/framework';
import JiraClient from 'jira-client';
import superagent from 'superagent';

import { Webhook } from './Webhook';

interface IFusebitCredentials {
  credentials: { access_token: string };
  lookupKey: string;
}

class AtlassianClient {
  public fusebit: IFusebitCredentials;
  public webhook: Webhook;
  public connectorId: string;

  constructor(ctx: Internal.Types.Context, connectorId: string, fusebit: IFusebitCredentials) {
    this.fusebit = fusebit;
    this.connectorId = connectorId;
    this.webhook = new Webhook(ctx, this);
  }

  public async getAccessibleResources(): Promise<superagent.Response> {
    const response = await superagent
      .get('https://api.atlassian.com/oauth/token/accessible-resources')
      .set('Authorization', `Bearer ${this.fusebit.credentials.access_token}`);
    return response.body;
  }

  public jira(...options: any): JiraClient {
    return new JiraClient({ ...options, bearer: this.fusebit.credentials.access_token });
  }
}

export default class AtlassianProvider extends Internal.ProviderActivator<AtlassianClient> {
  /*
   * This function will create an authorized wrapper for a variety of Atlassian clients.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AtlassianClient> {
    const credentials = await this.requestConnectorToken({ ctx, lookupKey });
    const client: AtlassianClient = new AtlassianClient(ctx, this.config.entityId, { credentials, lookupKey });
    return client;
  }
}

export { AtlassianClient, Webhook as AtlassianWebhook };
