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

export class Webhook {
  protected ctx: Internal.Types.Context;
  protected client: AtlassianClient;

  constructor(ctx: Internal.Types.Context, client: AtlassianClient) {
    this.ctx = ctx;
    this.client = client;
  }

  public static enable(integration: Integration) {
    integration.router.get('/api/atlassian/webhook/:webhookId', async (ctx: Internal.Types.Context) => {
      console.log(`Webhook received for webhook: ${ctx.params.webhookId}`);
    });
  }

  public async register(atlassianUrl: string, webhooks: IWebhookDetail[]): Promise<IWebhookRegisterResponses> {
    console.log(`Starting registration...: ${this.client.fusebit.credentials.access_token}`);
    const response = await superagent
      .post(`${atlassianUrl}/rest/api/2/webhook`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send(webhooks);

    console.log(`Webhook register response: `, response);

    await Promise.all(
      response.body.webhookRegistrationResult.map((hook: IWebhookRegisterResponse) => {
        if ('errors' in hook) {
          return;
        }
        this.ctx.storage.setData(
          `/atlassianProvider/${this.ctx.params.integrationId}/webhook/${this.client.fusebit.lookupKey}/${
            hook.createdWebhookId
          }/${encodeURI(atlassianUrl)}`,
          {}
        );
      })
    );

    return response.body;
  }

  public async extendAll() {
    const response = await this.ctx.storage.listData(`/atlassianProvider/${this.ctx.params.integrationId}/webhook`);

    response.items.forEach((item: { storageId: string }) => {
      const idPieces = item.storageId.split('/');
      const lookupKey = idPieces[3];
      const webhookId = idPieces[4];
      const atlassianUrl = idPieces[5];

      console.log(`Attempting to extend ${lookupKey} - ${webhookId} at ${atlassianUrl}`);
    });

    /*
    await Promise.all(webhookList.items.map((item) => {
      // XXX Get the credentials for that lookupKey
      superagent.put(`${atlassianUrl}/rest/api/2/webhook/refresh`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({webhookIds: item.webhooks});
     */
  }

  public list() {} // returns the list of webhooks for this specific user
  public unregister(id: number) {}
  public deleteAll() {} // Deletes all of the webhooks registered for this user
}
