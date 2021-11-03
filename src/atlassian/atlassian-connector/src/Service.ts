import * as jwt from 'jsonwebtoken';
import superagent from 'superagent';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.user.accountId;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const authJwt = ctx.req.headers.authorization?.split(' ')[1];
    if (!authJwt) {
      ctx.throw(403, 'Invalid authorization');
    }

    try {
      jwt.verify(authJwt, ctx.state.manager.config.configuration.clientSecret);
    } catch (err) {
      ctx.throw(403, 'Invalid authorization provided');
    }

    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    const response = await superagent
      .get('https://api.atlassian.com/me')
      .set('Authorization', `Bearer ${token.access_token}`);

    if (response.body.account_type !== 'atlassian') {
      ctx.throw(500, 'Unsupported account type for user');
    }

    return response.body.account_id;
  }

  protected getWebhookEventType(event: any): string {
    return event.webhookEvent;
  }
}

export { Service };
