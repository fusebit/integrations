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
  public create = async (args: IPipedriveWebhookConfig) => {
    const webhookId = uuidv4();
    const password = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const createWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/create`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}`;
    await superagent
      .post('https://api.pipedrive.com/v1/webhooks')
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send({
        ...args,
        http_auth_user: webhookId,
        http_auth_password: password,
        subscription_url: webhookUrl,
      });
    await superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send({
      webhookId,
      password,
    });

    return { webhookId };
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
      .delete(`https://api.pipedrive.com/v1/webhooks/${webhook.id}`)
      .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
      .send();
  };

  public deleteAll = async () => {
    const allWebhooks = await this.list();
    await Promise.all(
      allWebhooks.map((webhook: any) =>
        superagent
          .delete(`https://api.pipedrive.com/v1/webhooks/${webhook.id}`)
          .set('Authorization', `Bearer ${this.client.fusebit.credentials.access_token}`)
          .send()
      )
    );
  };
}
