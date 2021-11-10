import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body.event];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return 'global';
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context) {
    return false;
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return 'global';
  }

  protected getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
