import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';
import { verifyJwt } from './jwt';

class Service extends Connector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.recipient.id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const token = ctx.req.headers?.authorization?.split(' ')[1];
    const metadataUrl = 'https://login.botframework.com/v1/.well-known/openidconfiguration';
    const metadataResponse = await superagent.get(metadataUrl);
    const { jwks_uri } = metadataResponse.body;
    await verifyJwt(token!, jwks_uri!);
    return true;
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  protected getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
