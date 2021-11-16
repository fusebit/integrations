import { Internal } from '@fusebit-int/framework';
import { PartialCall } from '@pagerduty/pdjs/build/src/api';
import { v4 as uuidv4 } from 'uuid';
import Superagent from 'superagent';
type FusebitPagerDutyClient = PartialCall & { fusebit?: object };

interface PagerDutyWebhookRegistrationArgs {
  description: string;
  events: string[];
  filter: PDWebhookFilter;
}

interface PDWebhookFilter {
  type: string;
  id: string;
}

export default class PagerDutyWebhook implements Internal.Types.WebhookClient<any> {
  constructor(
    private ctx: Internal.Types.Context,
    private lookupKey: string,
    private installId: string,
    private config: Internal.Types.IInstanceConnectorConfig,
    private client: FusebitPagerDutyClient
  ) {}
  /**
   *
   * @param args The configuration for the pagerduty webhook.
   */
  public create = async (args: PagerDutyWebhookRegistrationArgs) => {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    const createWebhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/create`;
    const webhookUrl = `${baseUrl}/connector/${this.config.entityId}/api/fusebit/webhook/event/${webhookId}`;
    const results = await this.client.post('/webhook_subscription', {
      data: {
        webhook_subscription: {
          ...args,
          delivery_method: {
            type: 'http_delivery_method',
            url: webhookUrl,
          },
          type: 'webhook_subscription',
        },
      },
    });
    await Superagent.post(createWebhookUrl).set('Authorization', `Bearer ${params.functionAccessToken}`).send({
      webhookId,
      signingSecret: results.data.delivery_method.secret,
    });
    return { webhookId: results.data.id };
  };

  public get = async (webhook: string): Promise<any> => {
    const fusebitWebook = await this.client.get(`/webhook_subscriptions/${webhook}`);
    return fusebitWebook.data;
  };

  public list = async (): Promise<any> => {
    const fusebitWebhooks = await this.client.get('webhook_subscriptions');
    return fusebitWebhooks.data.webhook_subscriptions;
  };

  public delete = async (webhook: string) => {
    this.client.delete(`/webhook_subscriptions/${webhook}`);
  };

  public deleteAll = async () => {
    const webhooks = await this.list();
    await Promise.all(
      webhooks.map((webhook: any) => {
        return this.delete(webhook.id);
      })
    );
  };
}
