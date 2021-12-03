import { Connector } from '@fusebit-int/framework';
import superagent from 'superagent';
import { verifyJwt } from './jwt';

class Service extends Connector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.recipient.id;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const { authorization } = ctx.req.headers;
    if (!authorization || !authorization.toLocaleLowerCase().startsWith('bearer ')) {
      ctx.throw(403, 'Invalid authorization');
    }
    const token = authorization.split(' ')[1];
    if (!token) {
      ctx.throw(403, 'Invalid authorization');
    }

    const metadataUrl = 'https://login.botframework.com/v1/.well-known/openidconfiguration';
    const metadataResponse = await superagent.get(metadataUrl);
    const { jwks_uri } = metadataResponse.body;

    try {
      await verifyJwt(token, jwks_uri);
    } catch (err) {
      ctx.throw(403, 'Invalid authorization provided');
    }

    return true;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
