import crypto from 'crypto';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import WebhookManager from './WebhookManager';
import { IWebhookUrlParts } from './types';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    const { eventType } = this.getWebhookInfoFromRequest(ctx);
    return [{ ...ctx.req.body, type: eventType, companyDomain: `${ctx.req.headers['company-domain']}.bamboohr.com` }];
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
    ctx.req.body = {
      ...ctx.req.body,
      webhook: {
        id: fusebitWebhook.data.id,
      },
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

  public registerWebhook = async (ctx: Connector.Types.Context, apiKey: string, companyDomain: string) => {
    const webhookManager = new WebhookManager({
      ctx,
      apiKey,
      companyDomain,
    });

    // Create the Webhook at BambooHR
    const { webhookId, privateKey, id } = await webhookManager.create(ctx.req.body);

    // Register the Webhook in Fusebit
    const webhookStorage = await this.getFusebitWebhook(ctx, webhookId);
    if (webhookStorage) {
      return (ctx.status = 409);
    }
    const createdTime = Date.now();
    await this.utilities.setData(ctx, this.getStorageKey(webhookId), { data: { privateKey, createdTime, id } });
  };

  public deleteWebhook = async (ctx: Connector.Types.Context, apiKey: string, companyDomain: string) => {
    const { id } = ctx.params;
    const webhookManager = new WebhookManager({
      ctx,
      apiKey,
      companyDomain,
    });
    const { url } = await webhookManager.delete((id as unknown) as number);
    const { webhookId } = this.getWebhookInfoFromUrl(url);
    await this.utilities.deleteData(ctx, this.getStorageKey(webhookId));
  };
}

export { Service };
