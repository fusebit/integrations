import { v4 as uuidv4 } from 'uuid';
import { LinearClient as Client } from '@linear/sdk';
import { Internal } from '@fusebit-int/framework';

type LinearFusebitClient = Client & { fusebit?: any };

interface ILinearWebhookConfig {
  teamId?: string;
  allPublicTeams?: boolean;
  resourceTypes: string[];
}

class LinearWebhook implements Internal.Types.WebhookClient<any> {
  constructor(
    private ctx: Internal.Types.Context,
    private lookupKey: string,
    private installId: string,
    private config: Internal.Types.IInstanceConnectorConfig,
    private client: LinearFusebitClient
  ) {}

  public create = async (args: ILinearWebhookConfig) => {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}`;
    const results = await this.client.webhookCreate({
      url: webhookUrl,
      ...args,
    });
    return { success: results.success, webhookId: (await results.webhook)?.id as string };
  };

  public list = async () => {
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
      webhooks.map((webhook) => {
        this.delete(webhook.id);
      })
    );
  };
}

export default LinearWebhook;
