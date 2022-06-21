import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

interface IPipedriveWebhookConfig {
  event_action: 'added' | 'updated' | 'merged' | 'deleted' | '*';
  event_object:
    | 'activity'
    | 'activityType'
    | 'deal'
    | 'note'
    | 'organization'
    | 'person'
    | 'pipeline'
    | 'product'
    | 'stage'
    | 'user'
    | '*';
  user_id?: string;
}

export class PipedriveWebhook extends Internal.Provider.WebhookClient {
  connectorBaseUrl = `${this.ctx.state.params.endpoint}/v2/account/${this.ctx.state.params.accountId}/subscription/${this.ctx.state.params.subscriptionId}/connector/${this.config.entityId}`;

  public create = async (args: IPipedriveWebhookConfig) => {
    const response = await superagent
      .post(`${this.connectorBaseUrl}/api/fusebit/webhook`)
      .set('Authorization', `Bearer ${this.ctx.state.params.functionAccessToken}`)
      .send({
        args,
        access_token: this.client.fusebit.credentials.access_token,
      });

    return { webhookId: response.body.webhookId };
  };

  public list = async () => {
    const webhooks = await superagent
      .get('https://api.pipedrive.com/v1/webhooks')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send();
    return webhooks.body.data;
  };

  public get = async (webhookId: string) => {
    return (await this.list()).find((webhook: any) => webhook.http_auth_user === webhookId);
  };

  public delete = async (webhookId: string) => {
    const webhook = await this.get(webhookId);
    await superagent
      .delete(`${this.connectorBaseUrl}/api/fusebit/webhook/${webhook.id}`)
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({
        access_token: this.client.fusebit.credentials.access_token,
      });
  };

  public deleteAll = async () => {
    const allWebhooks = await this.list();
    await Promise.all(
      allWebhooks.map((webhook: any) =>
        superagent
          .delete(`${this.connectorBaseUrl}/api/fusebit/webhook/${webhook.id}`)
          .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
          .send({
            access_token: this.client.fusebit.credentials.access_token,
          })
      )
    );
  };
}
