import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body;
  }

  protected getAuthIdFromEvent(event: any): string {
    return '';
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    // Linear does not implement HMAC based webhook source validation.
    // Best to assume all webhooks are legit for now.
    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    // Linear does not implement initialization challenge besides that the endpoint returns 200.
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    return '';
  }

  protected getWebhookEventType(event: any): string {
    return event.action;
  }
}

export { Service };
