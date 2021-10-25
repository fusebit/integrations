import { Internal } from '@fusebit-int/framework';
import JiraClient from 'jira-client';
import superagent from 'superagent';

import { Webhook } from './Webhook';

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

  public jira(cloudId: string, ...options: any): JiraClient {
    return new JiraClient({
      ...options,
      protocol: 'https',
      host: `api.atlassian.com/ex/jira/${cloudId}`,
      bearer: this.fusebit.credentials.access_token,
    });
  }
}

export default class AtlassianProvider extends Internal.ProviderActivator<AtlassianClient> {
  /*
   * This function will create an authorized wrapper for a variety of Atlassian clients.
   */
  protected async instantiate(ctx: Internal.Types.Context, lookupKey: string): Promise<AtlassianClient> {
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
