import superagent from 'superagent';
import { v4 as uuidv4 } from 'uuid';

import { Connector } from '@fusebit-int/framework';
import { IBambooHRWebhook, IBambooHRWebhookResponse } from './types';

type CreatedWebhookResponse = IBambooHRWebhookResponse & { webhookId: string };

export interface IOptions {
  apiKey: string;
  companyDomain: string;
  ctx: Connector.Types.Context;
}

class WebhookManager {
  private apiPath: string;
  private apiKey: string;
  private ctx: Connector.Types.Context;

  constructor({ ctx, apiKey, companyDomain }: IOptions) {
    this.ctx = ctx;
    this.apiPath = `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1`;
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(verb: string, path: string, entityId: string, body?: any): Promise<T> {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return (
      await (superagent as any)
        [verb](`${this.apiPath}/${path}`)
        .set('User-Agent', `fusebit/${entityId}`)
        .set('Authorization', `Basic ${auth}`)
        .send(body)
    ).body;
  }

  async create(args: IBambooHRWebhook): Promise<CreatedWebhookResponse> {
    const webhookId = uuidv4();
    const params = this.ctx.state.params;
    const baseUrl = `${params.endpoint}/v2/account/${params.accountId}/subscription/${params.subscriptionId}`;
    // We use the Webhook name property to identify the event type
    args.name = (args.name || 'bamboohr-event').replace(/\s/g, '-');
    const webhookUrl = `${baseUrl}/connector/${params.entityId}/api/fusebit/webhook/event/${webhookId}/action/${args.name}`;

    // Register the Webhook in BambooHR.
    const createdWebhook = await this.makeRequest<IBambooHRWebhookResponse>('post', 'webhooks', params.entityId, {
      ...args,
      url: webhookUrl,
      format: 'json',
      includeCompanyDomain: true,
    });

    return { ...createdWebhook, webhookId };
  }
}

export default WebhookManager;
