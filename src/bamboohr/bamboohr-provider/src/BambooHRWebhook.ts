import superagent from 'superagent';
import { Internal } from '@fusebit-int/framework';
import { Types } from '@fusebit-int/bamboohr-connector';

import {
  IBambooHRWebhookList,
  FusebitBambooHRClient,
  IBambooHRWebhookLog,
  IBambooHRWebhookMonitorField,
} from './types';

class BambooHRWebhook extends Internal.Provider.WebhookClient<FusebitBambooHRClient> {
  /**
   * @typedef {object} BambooHRWebhookResponse
   * @property {number} id The id of the webhook
   * @property {string} name The name of the webhook.
   * @property {object} postFields A list of fields to post to the webhook url. Field ID or alias: external name
   * @property {Array.<string>} monitorFields A list of fields to monitor.
   * @property {object} frequency How often the webhook could fire.
   * @property {object} limit To limit how often to potentially fire a webhook, and maximum amount of records to send
   */

  /**
   * @typedef {object} BambooHRWebhook
   * @property {string} name The name of the webhook.
   * @property {object} postFields A list of fields to post to the webhook url. Field ID or alias: external name
   * @property {Array.<string>} monitorFields A list of fields to monitor.
   * @property {object} frequency How often the webhook could fire.
   * @property {object} limit To limit how often to potentially fire a webhook, and maximum amount of records to send
   */

  /**
   * Register a new BambooHR webhook
   * @param {BambooHRWebhook} args The configuration for the BambooHR webhook.
   * @returns {BambooHRWebhookResponse} Webhook created
   */
  public create = async (args: Types.IBambooHRWebhook): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.makeRequest<Types.IBambooHRWebhookResponse>('post')(`${this.lookupKey}`, args);
  };

  /**
   * Update a webhook, based on webhook ID.
   * @param {BambooHRWebhook} args The configuration for the BambooHR webhook to update.
   * @returns {BambooHRWebhookResponse} Webhook updated
   */
  public update = async (id: number, args: Types.IBambooHRWebhook): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.makeRequest<Types.IBambooHRWebhookResponse>('put')(`${this.lookupKey}/${id}`, args);
  };

  /**
   * Get webhook data that is tied to a specific user API Key.
   * @param {number} id The id of the Webhook to retrieve
   * @returns {BambooHRWebhookResponse}
   */
  public get = async (id: number): Promise<Types.IBambooHRWebhookResponse> => {
    return await this.client.get<Types.IBambooHRWebhookResponse>(`webhooks/${id}`);
  };

  /**
   * Gets as list of webhooks for the user API key.
   * @returns {Array.<BambooHRWebhookResponse>}
   */
  public list = async (): Promise<IBambooHRWebhookList> => {
    return await this.client.get<IBambooHRWebhookList>('webhooks');
  };

  /**
   * @typedef {object} BambooHRWebhookLog
   * @property {number} webhookId The id of the webhook
   * @property {string} url The URL of the webhook.
   * @property {string} lastAttempted Timestamp of last time the webhook was sent
   * @property {string} lastSuccess timestamp of last time the webhook was sent successfully
   * @property {number} failureCount Count of how many times this call failed since last success
   * @property {number} statusCode Status code of last request
   * @property {Array.<number>} employeeIds A list of employee ids that were changed.
   */

  /**
   * Get webhook logs for specific webhook id that is associated with the user API Key.
   * @param {number} id The id of the Webhook to retrieve the logs
   * @returns {Array.<BambooHRWebhookLog>}
   */
  public getLogs = async (id: number): Promise<IBambooHRWebhookLog[]> => {
    return await this.client.get<IBambooHRWebhookLog[]>(`webhooks/${id}/log`);
  };

  /**
   * @typedef {object} BambooHRWebhookMonitorField
   * @property {number} id The id of the field
   * @property {string} name The name of the field
   * @property {string} alias The alias of the field
   */

  /**
   * Get a list fields webhooks can monitor
   * @returns {Array.<BambooHRWebhookMonitorField>}
   */
  public getMonitorFields = async (): Promise<IBambooHRWebhookMonitorField[]> => {
    return await this.client.get<IBambooHRWebhookMonitorField[]>('webhooks/monitor_fields');
  };

  /**
   * Delete a specific Webhook associated with the user API Key
   * @param {number} id The id of the webhook to delete
   */
  public delete = async (id: number) => {
    await this.makeRequest('delete')(`${this.lookupKey}/${id}`);
  };

  /**
   * Delete all registered BambooHR Webhooks that is associated with the user API Key
   */
  public deleteAll = async () => {
    const { webhooks } = await this.list();
    await Promise.all(webhooks.map(async (webhook) => this.delete(webhook.id)));
  };

  private makeRequest = <T>(verb: string) => {
    return async (path: string, data?: any): Promise<T> => {
      const params = this.ctx.state.params;
      const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
      const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/webhook/${path}`;
      return (
        await (superagent as any)
          [verb](webhookUrl)
          .set('Authorization', `Bearer ${params.functionAccessToken}`)
          .send(data)
      ).body;
    };
  };
}

export default BambooHRWebhook;
