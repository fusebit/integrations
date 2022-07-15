import { IncomingMessage } from 'http';
import crypto from 'crypto';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

type BambooHRRequest = IncomingMessage & { body?: any; path: string };
interface WebhookInfo {
  webhookId: string;
  eventType: string;
}

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    const { eventType } = this.getWebhookInfoFromRequest(ctx);
    return [{ ...ctx.req.body, type: eventType, companyDomain: `${ctx.req.headers['company-domain']}.bamboohr.com` }];
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return [`company_domain/${encodeURIComponent(token.companyDomain)}`];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `company_domain/${event.companyDomain}`;
  }

  private getWebhookInfoFromRequest(ctx: Connector.Types.Context): WebhookInfo {
    const [, webhookInfo] = (ctx.req as BambooHRRequest).path.split('/api/fusebit/webhook/event/');
    const [webhookId, eventType] = webhookInfo.split('/');
    return { webhookId, eventType };
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const req = ctx.req as BambooHRRequest;
    const timestamp = req.headers['x-bamboohr-timestamp'];
    const userAgent = req.headers['user-agent'];
    const signature = req.headers['x-bamboohr-signature'] as string;
    const { webhookId, eventType } = this.getWebhookInfoFromRequest(ctx);

    if (
      !timestamp ||
      !signature ||
      !webhookId ||
      !eventType ||
      userAgent !== 'BambooHR-WebHooks/1.0 (+https://www.bamboohr.com)'
    ) {
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

  public registerWebhook = async (ctx: Connector.Types.Context) => {
    const { webhookId, id, privateKey } = ctx.req.body;
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { privateKey, createdTime, id } });
    await this.utilities.setData(ctx, this.getStorageKey(id), { data: { webhookId, createdTime } });
  };

  public deleteWebhook = async (ctx: Connector.Types.Context) => {
    const { id } = ctx.params;
    const bamboohrWebhook = await this.getFusebitWebhook(ctx, id);
    if (!bamboohrWebhook) {
      return (ctx.status = 404);
    }
    const { webhookId } = bamboohrWebhook.data;
    await this.utilities.deleteData(ctx, this.getStorageKey(webhookId));
    await this.utilities.deleteData(ctx, this.getStorageKey(id));
  };
}

export { Service };
