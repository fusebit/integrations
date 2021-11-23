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
  protected getAtlassianUrl(cloudId: string) {
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`;
  }

  protected getInboundUrl() {
    const params = this.ctx.state.params;
    return `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${this.client.fusebit.connectorId}/api/fusebit/webhook/event`;
  }

  public async extendAll() {
    const resources = await this.client.getAccessibleResources();
    return await Promise.all(
      resources.map(async (resource: IAtlassianAccessibleResource) => {
        const cloudId = resource.id;
        const list = await this.list(cloudId);
        return this.extend(
          cloudId,
          list.values.map((hook) => hook.id)
        );
      })
    );
  }

  public async extend(cloudId: string, webhookIds: number[]) {
    return superagent
      .put(`${this.getAtlassianUrl(cloudId)}/refresh`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });
  }

  public create = async (cloudId: string, webhooks: IWebhookDetail[]): Promise<IWebhookRegisterResponses> => {
    const response = await superagent
      .post(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhooks, url: this.getInboundUrl() });

    return response.body;
  };

  public list = async (cloudId: string, options?: { next?: number; count?: number }): Promise<IListWebhookResult> => {
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
  };

  public get = async (cloudId: string, webhookId: number): Promise<IFullWebhookDetail | void> => {
    let isLast = false;
    let next = 0;
    do {
      const listResponse = await this.list(cloudId, { next });
      const webhooks = listResponse.values;
      const webhook = webhooks.find((webhook) => webhook.id == webhookId);
      if (webhook) {
        return webhook;
      }
      isLast = listResponse.isLast;
      next = listResponse.startAt + listResponse.total;
    } while (!isLast);
  };

  public delete = async (cloudId: string, webhookIds: number[]) => {
    const response = await superagent
      .delete(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds });

    return response.body;
  };

  public deleteAll = async () => {
    const resources = await this.client.getAccessibleResources();
    return await Promise.all(
      resources.map(async (resource: IAtlassianAccessibleResource) => {
        const cloudId = resource.id;
        const list = await this.list(cloudId);
        return this.delete(
          cloudId,
          list.values.map((hook) => hook.id)
        );
      })
    );
  };
}
