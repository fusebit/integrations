import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';

interface Event extends Record<string, any> {
  installId: string;
}

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body.events.map((event: Event) => {
      event.webhookId = ctx.params.webhookId;
      return event;
    });
  }

  protected getAuthIdFromEvent(event: any) {
    return event.webhookId;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    if (ctx.req.headers['x-hook-secret']) {
      return true;
    }
    const signingSecret = (await ctx.fusebit.getWebhookSecret())?.data;
    // TODO: we should move this into the base service.  It's a useful piece of code that we're already starting to duplicate
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody)
      .replace(/\//g, '\\/')
      .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

    const calculatedSignature = crypto.createHmac('sha256', signingSecret).update(rawBody).digest('hex');

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

    const webhookChallengeExpiryTime = await ctx.fusebit.getWebhookCreateExpiry();
    if (!webhookChallengeExpiryTime) {
      return true;
    }

    if (webhookChallengeExpiryTime.data < Date.now()) {
      return true;
    }
    ctx.fusebit.setWebhookSecret(secret);
    ctx.res.setHeader('x-hook-secret', secret);
    return true;
  }

  protected getWebhookEventType(event: any): string {
    return [event.resource.resource_type, event.action].join('/');
  }
}

export { Service };
