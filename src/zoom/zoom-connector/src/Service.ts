import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import superagent from 'superagent';
class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.payload.account_id;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    return ctx.req.headers.authorization === ctx.state.manager.config.configuration.webhookSecret;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    // Yet another service with no initialization challenge.
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const me = await superagent
      .get('https://api.zoom.us/v2/users/me')
      .set('Authorization', `Bearer ${token.access_token}`);
    return me.body.account_id;
  }

  public getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
