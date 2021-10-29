import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return '';
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    return '';
  }

  protected getWebhookEventType(event: any): string {
    return '';
  }
}

export { Service };
