---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/src/Service.ts
---
import { Connector } from '@fusebit-int/framework';

class Service extends Connector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    ctx.throw(500, 'Event location configuration missing. Required for webhook processing.');
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return '';
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Validation configuration missing. Required for webhook processing.');
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    ctx.throw(500, 'Webhook Challenge configuration missing. Required for webhook processing.');
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return '';
  }

  public getWebhookEventType(event: any): string {
    return '';
  }
}

export { Service };
