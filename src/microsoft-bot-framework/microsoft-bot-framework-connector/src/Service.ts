import { Connector } from '@fusebit-int/framework';

class Service extends Connector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.recipient.id;
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    // TODO https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication?view=azure-bot-service-4.0#openid-metadata-document
    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    return false;
  }

  protected getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
