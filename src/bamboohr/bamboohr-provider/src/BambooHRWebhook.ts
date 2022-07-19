import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';

import { IBambooHRWebhookList, FusebitBambooHRClient } from './types';
import { Types } from '@fusebit-int/bamboohr-connector';

class BambooHRWebhook extends Internal.Provider.WebhookClient<FusebitBambooHRClient> {
  /**
   * Register a new BambooHR webhook
   * @param args {object} The configuration for the BambooHR webhook.
   */
  public create = async (args: Types.IBambooHRWebhook): Promise<Types.IBambooHRWebhookResponse> => {
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const createWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/webhook/${this.lookupKey}`;

    // Register the Webhook in Fusebit
    const createdWebhook = await superagent
      .post(createWebhookUrl)
      .set('Authorization', `Bearer ${params.functionAccessToken}`)
      .send(args);

    return createdWebhook.body;
  };

  /**
   * Update a BambooHR webhook
   * @param args {object} The configuration for the BambooHR webhook.
   */
  public update = async (id: number, args: Types.IBambooHRWebhook): Promise<Types.IBambooHRWebhookResponse> => {
    // We use the Webhook name property to identify the event type
    args.name = (args.name || 'bamboohr-event').replace(/\s/g, '-');
    // Update the Webhook in BambooHR.
    const { url } = await this.get(id);
    const { path, webhookId } = this.getWebhookUrlParts(url);
    const updatedWebhook = await this.client.put<Types.IBambooHRWebhookResponse>(`webhooks/${id}`, {
      ...args,
      // Despite the fact we don't allow to change the Webhook URL (we create it automatically)
      // BambooHR update API requires sending the URL even if it is the same value since PATCH
      // is not supported. Hence, we are recreating it here.
      url: `${path}/event/${webhookId}/action/${args.name}`,
      format: 'json',
      includeCompanyDomain: true,
    });

    return updatedWebhook;
  };

  public get = async (webhookId: number): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.client.get<Types.IBambooHRWebhookResponse>(`webhooks/${webhookId}`);
  };

  public list = async (): Promise<IBambooHRWebhookList> => {
    return await this.client.get<IBambooHRWebhookList>('webhooks');
  };

  public getLogs = async (id: number): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.client.get<Types.IBambooHRWebhookResponse>(`webhooks/${id}/log`);
  };

  public getMonitorFields = async (): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.client.get<Types.IBambooHRWebhookResponse>('webhooks/monitor_fields');
  };

  public delete = async (id: number) => {
    await this.client.delete(`webhooks/${id}`);

    // Remove webhook from Fusebit
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const { url } = await this.get(id);
    const { webhookId } = this.getWebhookUrlParts(url);
    const webhookPath = `${baseUrl}/connector/${this.config.entityId}/api/webhook/${webhookId}`;
    await superagent.delete(webhookPath).set('Authorization', `Bearer ${params.functionAccessToken}`).send();
  };

  public deleteAll = async () => {
    const { webhooks } = await this.list();
    await Promise.all(webhooks.map(async (webhook) => this.delete(webhook.id)));
  };

  private getWebhookUrlParts(url: string): Types.IWebhookUrlParts {
    const [path, webhookPath] = url.split('/event/');
    const [webhookId, eventType] = webhookPath.split('/action/');
    return {
      webhookId,
      eventType,
      path,
    };
  }
}

export default BambooHRWebhook;
