import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import {
  IAtlassianAccessibleResource,
  IFullWebhookDetail,
  IListWebhookResult,
  IWebhookDetail,
  IWebhookRegisterResponses,
} from './Types';

export class AtlassianWebhook extends Internal.WebhookClient {
  // Right now it looks like only Jira webhooks have a published Webhook SDK.  When that changes, support an
  // additional parameter in the integration.webhook.getSdk, or a parameter on this object, to specify the
  // cloudId and the type of cloud to use for these calls.
  protected getAtlassianUrl(jiraCloudId: string) {
    return `https://api.atlassian.com/ex/jira/${jiraCloudId}/rest/api/3/webhook`;
  }

  protected getInboundUrl() {
    const params = this.ctx.state.params;
    return `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.client.fusebit.connectorId}/api/fusebit/webhook/event`;
  }

  public async extendAll() {
    const resources = await this.client.getAccessibleResources('jira');
    return await Promise.all(
      resources.map(async (resource: IAtlassianAccessibleResource) => {
        const jiraCloudId = resource.id;
        const list = await this.list(jiraCloudId);
        return this.extend(
          jiraCloudId,
          list.values.map((hook) => hook.id)
        );
      })
    );
  }

  public async extend(jiraCloudId: string, webhookIds: number[]) {
    return superagent
      .put(`${this.getAtlassianUrl(jiraCloudId)}/refresh`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });
  }

  public create = async (jiraCloudId: string, webhooks: IWebhookDetail[]): Promise<IWebhookRegisterResponses> => {
    const response = await superagent
      .post(this.getAtlassianUrl(jiraCloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhooks, url: this.getInboundUrl() });

    return response.body;
  };

  public list = async (
    jiraCloudId: string,
    options?: { next?: number; count?: number }
  ): Promise<IListWebhookResult> => {
    const url = new URL(this.getAtlassianUrl(jiraCloudId));

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
  };

  public get = async (jiraCloudId: string, webhookId: number): Promise<IFullWebhookDetail | void> => {
    let isLast = false;
    let next = 0;
    do {
      const listResponse = await this.list(jiraCloudId, { next });
      const webhooks = listResponse.values;
      const webhook = webhooks.find((webhook) => webhook.id == webhookId);
      if (webhook) {
        return webhook;
      }
      isLast = listResponse.isLast;
      next = listResponse.startAt + listResponse.total;
    } while (!isLast);
  };

  public delete = async (jiraCloudId: string, webhookIds: number[]) => {
    const response = await superagent
      .delete(this.getAtlassianUrl(jiraCloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });

    return response.body;
  };

  public deleteAll = async () => {
    const resources = await this.client.getAccessibleResources('jira');
    return await Promise.all(
      resources.map(async (resource: IAtlassianAccessibleResource) => {
        const jiraCloudId = resource.id;
        const list = await this.list(jiraCloudId);
        return this.delete(
          jiraCloudId,
          list.values.map((hook) => hook.id)
        );
      })
    );
  };
}
