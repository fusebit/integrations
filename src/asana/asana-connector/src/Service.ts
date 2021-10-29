import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body.events.map((event: Event) => {
      event.webhookId = ctx.params.webhookId;
      return event;
    });
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return event.webhookId;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    if (ctx.req.headers['x-hook-secret']) {
      return true;
    }
    const {secret: storageSecret} = await ctx.fusebit.getWebhookData();
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody)
      .replace(/\//g, '\\/')
      .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));
    const calculatedSignature = crypto.createHmac('sha256', storageSecret).update(rawBody).digest('hex');

    const signature = ctx.req.headers['x-hook-signature'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(signature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    const secret = ctx.req.headers['x-hook-secret'];
    if (!secret) {
      return false;
    }

    const {expiry:webhookChallengeExpiryTime} = await ctx.fusebit.getWebhookStorageData();
    if (!webhookChallengeExpiryTime) {
      return true;
    }

    if (webhookChallengeExpiryTime.data < Date.now()) {
      return true;
    }
    ctx.fusebit.setWebhookStorageData({secret});
    ctx.res.setHeader('x-hook-secret', secret);
    return true;
  }

  protected getWebhookEventType(event: any): string {
    return event.action;
  }
}

export { Service };
