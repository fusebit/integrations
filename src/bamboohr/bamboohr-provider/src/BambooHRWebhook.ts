import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

import { BambooHRClient } from './BambooHRClient';
import { IBambooHRWebhook, IBambooHRWebhookResponse, IBambooHRWebhookList } from './types';

class BambooHRWebhook extends Internal.Provider.WebhookClient<BambooHRClient> {
  /**
   * Register a new BambooHR webhook
   * @param args {object} The configuration for the BambooHR webhook.
   */
  public create = async (args: IBambooHRWebhook): Promise<IBambooHRWebhookResponse> => {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const createWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/webhook`;
    // We use the Webhook name property to identify the event type
    args.name = (args.name || 'bamboohr-event').replace(/\s/g, '-');
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}/${args.name}`;

    // Register the Webhook in BambooHR.
    const createdWebhook = await this.client.rest.post<IBambooHRWebhookResponse>('webhooks', {
      ...args,
      url: webhookUrl,
      format: 'json',
      includeCompanyDomain: true,
    });

    // Register the Webhook in Fusebit
    await superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send({
      webhookId,
      id: createdWebhook.id,
      privateKey: createdWebhook.privateKey,
    });

    return createdWebhook;
  };

  /**
   * Update a BambooHR webhook
   * @param args {object} The configuration for the BambooHR webhook.
   */
  public update = async (id: number, args: IBambooHRWebhook): Promise<IBambooHRWebhookResponse> => {
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookBasePath = `${baseUrl}/connector/${this.config.entityId}/api/webhook`;
    // We use the Webhook name property to identify the event type
    args.name = (args.name || 'bamboohr-event').replace(/\s/g, '-');

    // Get associated Webhook Id from Fusebit storage
    const webhookStorage = await superagent
      .get(`${webhookBasePath}/${id}/storage`)
      .set('Authorization', `Bearer ${params.functionAccessToken}`)
      .send();

    if (!webhookStorage) {
      this.ctx.throw(404, 'Cannot find metadata associated to the Webhook');
    }

    const webhookId = webhookStorage.body.data?.webhookId;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}/${args.name}`;

    // Update the Webhook in BambooHR.
    const updatedWebhook = await this.client.rest.put<IBambooHRWebhookResponse>(`webhooks/${id}`, {
      ...args,
      url: webhookUrl,
      format: 'json',
      includeCompanyDomain: true,
    });

    return updatedWebhook;
  };

  public get = async (webhookId: number): Promise<any> => {
    return await this.client.rest.get<IBambooHRWebhookResponse>(`webhooks/${webhookId}`);
  };

  public list = async (): Promise<IBambooHRWebhookList> => {
    return await this.client.rest.get<IBambooHRWebhookList>('webhooks');
  };

  public getLogs = async (id: number): Promise<any> => {
    return await this.client.rest.get<IBambooHRWebhookResponse>(`webhooks/${id}/log`);
  };

  public getMonitorFields = async (): Promise<any> => {
    return await this.client.rest.get<IBambooHRWebhookResponse>('webhooks/monitor_fields');
  };

  public delete = async (id: number) => {
    await this.client.rest.delete(`webhooks/${id}`);
    // Remove webhook from Fusebit
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookPath = `${baseUrl}/connector/${this.config.entityId}/api/webhook/${id}`;
    await superagent.delete(webhookPath).set('Authorization', `Bearer ${params.functionAccessToken}`).send();
  };

  public deleteAll = async () => {
    const { webhooks } = await this.list();
    await Promise.all(webhooks.map(async (webhook) => this.delete(webhook.id)));
  };
}

export default BambooHRWebhook;
