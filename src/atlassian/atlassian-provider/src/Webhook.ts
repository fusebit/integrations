import superagent from 'superagent';

import { Integration } from '@fusebit-int/framework';
import { Internal } from '@fusebit-int/framework';

import { AtlassianClient } from './AtlassianProvider';

interface IWebhookDetail {
  jqlFilter: string;
  events: string[];
  fieldIdsFilter?: string[];
  issuePropertyKeysFilter?: string[];
}

interface IWebhookRegister {
  webhooks: IWebhookDetail[];
}

interface IWebhookRegisterResult {
  createdWebhookId: number;
}

type IWebhookRegisterFailed = { errors: string[] };
type IWebhookRegisterResponse = IWebhookRegisterResult | IWebhookRegisterFailed;

interface IWebhookRegisterResponses {
  webhookRegistrationResult: IWebhookRegisterResponse[];
}

let integration: Integration;

export class Webhook {
  protected ctx: Internal.Types.Context;
  protected client: AtlassianClient;

  constructor(ctx: Internal.Types.Context, client: AtlassianClient) {
    this.ctx = ctx;
    this.client = client;
  }

  public static enable(integ: Integration) {
    integration = integ;
    integration.router.post(
      '/api/atlassian/webhook/:connectorId/:lookupKey/:cloudId',
      async (ctx: Internal.Types.Context) => {
        const params = ctx.state.params;
        const verifyUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}/connector/${ctx.params.connectorId}/api/verify`;

        console.log(`verifyUrl: ${verifyUrl}`);

        if (!ctx.req.headers.authorization) {
          ctx.throw(403, 'Invalid authorization');
        }

        await superagent
          .post(verifyUrl)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
          .send({ authorization: ctx.req.headers.authorization.split(' ')[1] });

        const component = ctx.state.manager.config.components.find(
          (comp: Internal.Types.IInstanceConnectorConfig) => comp.entityId === ctx.params.connectorId
        );

        await ctx.state.manager.invoke(`/${component.name}/webhook/${ctx.params.lookupKey}`, ctx.req.body, ctx.state);
      }
    );
  }

  protected getAtlassianUrl(cloudId: string) {
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`;
  }

  protected getInboundUrl(lookupKey: string, cloudId: string) {
    const params = this.ctx.state.params;
    return `${params.baseUrl}/api/atlassian/webhook/${this.client.connectorId}/${lookupKey}/${cloudId}`;
  }

  protected getStorageKey(lookupKey: string, cloudId?: string, webhookId?: number) {
    return `/atlassianProvider/webhook/${lookupKey}/${cloudId ? `${cloudId}/${webhookId ? `${webhookId}/` : ''}` : ''}`;
  }

  protected fromStorageKey(storageId: string) {
    const pieces = storageId.split('/');
    return {
      lookupKey: pieces[2],
      cloudId: pieces[3],
      webhookId: pieces[4],
    };
  }

  public async register(cloudId: string, webhooks: IWebhookDetail[]): Promise<IWebhookRegisterResponses> {
    console.log(`Starting registration...: ${cloudId}`);
    console.log(`  ${this.getAtlassianUrl(cloudId)}`);
    console.log(`  ${this.getInboundUrl(this.client.fusebit.lookupKey, cloudId)}`);
    const response = await superagent
      .post(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhooks, url: this.getInboundUrl(this.client.fusebit.lookupKey, cloudId) });

    console.log(`Webhook register response: `, response.body);

    await Promise.all(
      response.body.webhookRegistrationResult.map(async (hook: IWebhookRegisterResponse) => {
        if ('errors' in hook) {
          return;
        }
        await integration.storage.setData(
          this.ctx,
          this.getStorageKey(this.client.fusebit.lookupKey, cloudId, hook.createdWebhookId),
          { data: {} }
        );
      })
    );

    return response.body;
  }

  /*
   * Probably need an additional variation that walks the whole list, acquiring credentials for all of them
   * and updating each one.
   */
  public async extendAll() {
    const entries = await integration.storage.listData(this.ctx, this.getStorageKey(this.client.fusebit.lookupKey));

    await Promise.all(
      entries.items.map(async (entry) => {
        const { cloudId, webhookId } = this.fromStorageKey(entry.storageId);
        await superagent
          .put(`${this.getAtlassianUrl(cloudId)}/refresh`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
          .send({ webhookIds: [webhookId] });
      })
    );
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

  public async unregister(cloudId: string, webhookId: number) {
    const response = await superagent
      .delete(this.getAtlassianUrl(cloudId))
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({ webhookIds: [webhookId] });

    return response.body;
  }

  public async deleteAll() {
    const entries = await integration.storage.listData(this.ctx, this.getStorageKey(this.client.fusebit.lookupKey));

    await Promise.all(
      entries.items.map(async (entry) => {
        const { cloudId, webhookId } = this.fromStorageKey(entry.storageId);
        await superagent
          .delete(this.getAtlassianUrl(cloudId))
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
          .send({ webhookIds: [webhookId] });

        await integration.storage.deleteData(
          this.ctx,
          this.getStorageKey(this.client.fusebit.lookupKey, cloudId, Number(webhookId))
        );
      })
    );
  }
}
