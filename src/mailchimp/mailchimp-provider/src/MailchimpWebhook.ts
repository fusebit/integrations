import { Internal } from '@fusebit-int/framework';
import { v4 as uuidv4 } from 'uuid';
import superagent from 'superagent';

import { IMailChimpWebhook, IMailChimpWebhookResponse, IMailchimpWebhookList } from '@mailchimp/mailchimp_marketing';

class MailchimpWebhook extends Internal.Provider.WebhookClient {
  /**
   * Register a new Mailchimp webhook
   * @param args {object} The configuration for the Mailchimp webhook.
   */
  public create = async (args: IMailChimpWebhook): Promise<IMailChimpWebhookResponse> => {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const createWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/create`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}`;

    // Register the Webhook in Mailchimp.
    const createdWebhook = await this.client.marketing.lists.createListWebhook(args.list_id, {
      url: args.secret ? `${webhookUrl}?secret=${args.secret}` : webhookUrl,
      events: args.events,
      sources: args.sources,
    });

    // Register the Webhook in Fusebit
    await superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send({
      webhookId,
      id: createdWebhook.id,
      secret: args.secret,
    });

    return createdWebhook;
  };

  /**
   * Update a Mailchimp webhook
   * @param args {object} The configuration for the Mailchimp webhook.
   */
  public update = async (
    args: Pick<IMailChimpWebhookResponse, 'id' | 'events' | 'list_id' | 'secret' | 'sources'>
  ): Promise<IMailChimpWebhookResponse> => {
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const updateWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/${args.id}`;

    const webhook = await this.get(args.list_id, args.id);
    const url = webhook.url.split('?secret=')[0];

    const updatedWebhook = await this.client.marketing.lists.updateListWebhook(args.list_id, args.id, {
      url: args.secret ? `${url}?secret=${args.secret}` : webhook.url,
      events: args.events,
      sources: args.sources,
    });

    // Update the Webhook in Fusebit
    await superagent.patch(updateWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send({
      secret: args.secret,
    });

    return updatedWebhook;
  };

  public get = async (listId: string, webhookId: string): Promise<IMailChimpWebhook> => {
    const webhook = await this.client.marketing.lists.getListWebhook(listId, webhookId);
    return webhook;
  };

  public list = async (listId: string): Promise<IMailchimpWebhookList> => {
    const webhooks = await this.client.marketing.lists.getListWebhooks(listId);
    return webhooks;
  };

  public delete = async (listId: string, webhookId: string) => {
    const deletedWebhook = await this.client.marketing.lists.deleteListWebhook(listId, webhookId);

    // Remove webhook from Fusebit
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/${webhookId}`;

    await superagent.delete(webhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send();

    return deletedWebhook;
  };

  public deleteAll = async () => {
    const { lists } = await this.client.marketing.lists.getAllLists();

    for await (const list of lists) {
      // Get list webhooks
      const { webhooks } = await this.list(list.id);

      for await (const webhook of webhooks) {
        await this.delete(list.id, webhook.id);
      }
    }
  };
}

export default MailchimpWebhook;
