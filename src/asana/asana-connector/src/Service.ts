import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from "crypto";

interface Event extends Record<string, any> {
  installId: string;
}

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body.events.map((event: Event) => {
      event.installId = ctx.params.installId;
      return event;
    });
  }

  protected getAuthIdFromEvent(event: any): string {
    return event.installId;
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody)
        .replace(/\//g, '\\/')
        .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

    const calculatedSignature = crypto.createHmac('sha256', signingSecret).update(rawBody).digest('hex');

    const signature = ctx.req.headers['X-HOOK-SIGNATURE'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(signature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    const secret = ctx.req.headers['X-HOOK-SECRET'];
    if (!secret) {
      return false;
    }
    ctx.headers['X-HOOK-SECRET'] = secret;
    return true;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    // Integration id?
    return token.data.id;
  }

  protected getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
