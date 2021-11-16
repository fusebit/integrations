import { Internal } from '@fusebit-int/framework';
import { api } from '@pagerduty/pdjs';
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

class PagerDutyWebhook implements Internal.Types.WebhookClient<any> {
  constructor(
    private ctx: Internal.Types.Context,
    private lookupKey: string,
    private installId: string,
    private config: Internal.Types.IInstanceConnectorConfig,
    private client: FusebitPagerDutyClient
  ) {}

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
  };
}
