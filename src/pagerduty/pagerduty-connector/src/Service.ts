import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';
class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body.event];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return '';
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context) {
    return false;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    return '';
  }

  protected getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
