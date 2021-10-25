import superagent from 'superagent';

import { Internal } from '@fusebit-int/framework';

import { AtlassianClient } from './AtlassianProvider';

interface IWebhookDetail {
  jqlFilter: string;
  events: string[];
  fieldIdsFilter?: string[];
  issuePropertyKeysFilter?: string[];
}

interface IWebhookRegisterResult {
  createdWebhookId: number;
}

type IWebhookRegisterFailed = { errors: string[] };
type IWebhookRegisterResponse = IWebhookRegisterResult | IWebhookRegisterFailed;

interface IWebhookRegisterResponses {
  webhookRegistrationResult: IWebhookRegisterResponse[];
}

export class Webhook {
  protected ctx: Internal.Types.Context;
  protected client: AtlassianClient;

  constructor(ctx: Internal.Types.Context, client: AtlassianClient) {
    this.ctx = ctx;
    this.client = client;
  }

  protected getAtlassianUrl(cloudId: string) {
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`;
  }

  protected getInboundUrl() {
    const params = this.ctx.state.params;
    return `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.client.fusebit.connectorId}/api/fusebit_webhook_event`;
  }

  public async register(cloudId: string, webhooks: IWebhookDetail[]): Promise<IWebhookRegisterResponses> {
    console.log(`Starting registration...: ${cloudId}`);
    console.log(`  ${this.getAtlassianUrl(cloudId)}`);
    console.log(`  ${this.getInboundUrl()}`);
    const response = await superagent
      .post(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhooks, url: this.getInboundUrl() });

    console.log(`Webhook register response: `, response.body);

    return response.body;
  }

  public async extendAll() {
    const resources = await this.client.getAccessibleResources();
    return await Promise.all(
      resources.map(async (resource) => {
        const cloudId = resource.id;
        const list = await this.list(cloudId);
        return this.extend(
          cloudId,
          list.values.map((hook: { id: string }) => hook.id)
        );
      })
    );
  }

  public async extend(cloudId: string, webhookIds: string[]) {
    return superagent
      .put(`${this.getAtlassianUrl(cloudId)}/refresh`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });
  }

  public async list(cloudId: string, options?: { next?: number; count?: number }) {
    const url = new URL(this.getAtlassianUrl(cloudId));

    if (options?.next) {
      url.searchParams.set('startsAt', `${options.next}`);
    }

    if (options?.count) {
      url.searchParams.set('maxResults', `${options.count}`);
    }

    const response = await superagent
      .get(url.toString())
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`);

    return response.body;
  }

  public async unregister(cloudId: string, webhookIds: number[]) {
    const response = await superagent
      .delete(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });

    return response.body;
  }

  public async unregisterAll() {
    const resources = await this.client.getAccessibleResources();
    return await Promise.all(
      resources.map(async (resource) => {
        const cloudId = resource.id;
        const list = await this.list(cloudId);
        return this.unregister(
          cloudId,
          list.values.map((hook: { id: string }) => hook.id)
        );
      })
    );
  }
}
