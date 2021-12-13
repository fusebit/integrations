import { v4 as uuidv4 } from 'uuid';
import { Internal } from '@fusebit-int/framework';

interface ILinearWebhookConfig {
  teamId?: string;
  allPublicTeams?: boolean;
  resourceTypes: string[];
}

class LinearWebhook extends Internal.Provider.WebhookClient {
  public create = async (args: ILinearWebhookConfig) => {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}`;
    const results = await this.client.webhookCreate({
      url: webhookUrl,
      id: webhookId,
      ...args,
    });
    return { success: results.success, webhook: webhookId };
  };

  public list = async (): Promise<any> => {
    const results = await this.client.webhooks();
    return { webhooks: results.nodes };
  };

  public get = async (webhookId: string) => {
    return this.client.webhook(webhookId);
  };

  public delete = async (webhookId: string) => {
    await this.client.webhookDelete(webhookId);
  };

  public deleteAll = async () => {
    const webhooks = await (await this.list()).webhooks;
    await Promise.all(
      webhooks.map((webhook: any) => {
        this.delete(webhook.id);
      })
    );
  };
}

export default LinearWebhook;
