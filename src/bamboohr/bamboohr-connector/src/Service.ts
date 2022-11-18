import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { IBambooHRWebhook, IBambooHRWebhookResponse, IWebhookUrlParts, BambooHRToken } from './types';
import Client from './Client';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    const { eventType } = this.getWebhookInfoFromRequest(ctx);
    return [
      {
        ...ctx.req.body,
        webhook: ctx.state.webhook,
        type: eventType,
        companyDomain: `${ctx.req.headers['company-domain']}.bamboohr.com`,
      },
    ];
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return [`company_domain/${token.companyDomain}`];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `company_domain/${event.companyDomain}`;
  }

  private getWebhookInfoFromRequest(ctx: Connector.Types.Context): IWebhookUrlParts {
    return this.getWebhookInfoFromUrl(ctx.path);
  }

  private getWebhookInfoFromUrl(url: string): IWebhookUrlParts {
    const [, path] = url.split('/event/');
    const [webhookId, eventType] = path.split('/action/');
    return {
      webhookId,
      eventType,
      path,
    };
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const req = ctx.req;
    const timestamp = req.headers['x-bamboohr-timestamp'];
    const signature = req.headers['x-bamboohr-signature'] as string;
    const { webhookId, eventType } = this.getWebhookInfoFromRequest(ctx);

    if (!timestamp || !signature || !webhookId || !eventType) {
      return false;
    }

    const fusebitWebhook = await this.getFusebitWebhook(ctx, webhookId);
    if (!fusebitWebhook) {
      return false;
    }

    const privateKey = fusebitWebhook.data.privateKey;
    const rawBody = JSON.stringify(ctx.req.body);
    const computedSignature = crypto
      .createHmac('sha256', privateKey)
      .update(rawBody + timestamp)
      .digest('hex');
    const calculatedSignatureBuffer = Buffer.from(computedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(signature, 'utf8');

    // Inject useful webhook info here.
    ctx.state.webhook = {
      id: fusebitWebhook.data.id,
    };

    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  // Use the Webhook name to identify the event
  public getWebhookEventType(event: any): string {
    return event.type;
  }

  public getFusebitWebhook = async (ctx: Connector.Types.Context, webhookId: string) => {
    return this.utilities.getData(ctx, this.getStorageKey(webhookId));
  };

  public getStorageKey = (webhookId: string) => {
    return `webhook/${webhookId}`;
  };

  private sanitizeWebhookData = (data: IBambooHRWebhook & BambooHRToken) => {
    // We use the Webhook name property to identify the event type
    data.name = (data.name || 'bamboohr-event').replace(/\s/g, '-');
    return { ...data };
  };

  private buildWebhookEventUrl = (ctx: Connector.Types.Context, webhookId: string, eventType: string) => {
    const { subscriptionId, endpoint, accountId, entityId } = ctx.state.params;
    const baseUrl = `${endpoint}/v2/account/${accountId}/subscription/${subscriptionId}`;
    return `${baseUrl}/connector/${entityId}/api/fusebit/webhook/event/${webhookId}/action/${eventType}`;
  };

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const webhookData = this.sanitizeWebhookData(ctx.req.body);
    const { apiKey, companyDomain } = webhookData;
    const client = new Client({
      apiKey,
      companyDomain,
    });

    // Create the Webhook at BambooHR
    const webhookId = uuidv4();
    const { entityId } = ctx.state.params;
    const webhookUrl = this.buildWebhookEventUrl(ctx, webhookId, webhookData.name);
    // Register the Webhook in BambooHR.
    const createdWebhook = await client.makeRequest<IBambooHRWebhookResponse>('post', 'webhooks', entityId, {
      ...webhookData,
      url: webhookUrl,
      format: 'json',
      includeCompanyDomain: true,
    });

    // Register the Webhook in Fusebit
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    const { privateKey, id } = createdWebhook;

    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { privateKey, createdTime, id } });
    // Prevent exposing the privateKey (only returned for Webhook creation)
    return { ...createdWebhook, privateKey: '' };
  };

  public updateWebhook = async (ctx: Connector.Types.Context) => {
    const webhookData = this.sanitizeWebhookData(ctx.req.body);
    const { apiKey, companyDomain } = webhookData;
    const { id } = ctx.params;
    const { entityId } = ctx.state.params;
    const client = new Client({
      apiKey,
      companyDomain,
    });
    const { url } = await client.makeRequest<IBambooHRWebhookResponse>('get', `webhooks/${id}`, entityId);
    const { webhookId } = this.getWebhookInfoFromUrl(url);
    const webhookUrl = this.buildWebhookEventUrl(ctx, webhookId, webhookData.name);
    const updatedWebhook = await client.makeRequest<IBambooHRWebhookResponse>('put', `webhooks/${id}`, entityId, {
      ...webhookData,
      url: webhookUrl,
      format: 'json',
      includeCompanyDomain: true,
    });

    return updatedWebhook;
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { id, entityId } = ctx.params;
    const { apiKey, companyDomain } = ctx.req.body;
    const client = new Client({
      apiKey,
      companyDomain,
    });
    const { url } = await client.makeRequest<IBambooHRWebhookResponse>('get', `webhooks/${id}`, entityId);
    await client.makeRequest<string>('delete', `webhooks/${id}`, entityId);
    const { webhookId } = this.getWebhookInfoFromUrl(url);
    await this.utilities.deleteData(ctx, this.getStorageKey(webhookId));
  };
}

export { Service };
