import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import crypto from 'crypto';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return ctx.req.body.eventNotifications || [];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `${event.realmId}`;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context) {
    const signature = ctx.req.headers['intuit-signature'];
    const verifierToken = ctx.state.manager.config.configuration.verifierToken;

    if (!signature) {
      return false;
    }

    if (!ctx.req.body) {
      ctx.dropEvent = true;
      return true;
    }

    const hash = crypto.createHmac('sha256', verifierToken).update(JSON.stringify(ctx.req.body)).digest('base64');
    if (hash != signature) {
      return false;
    }

    return true;
  }

  public async initializationChallenge(ctx: Connector.Types.Context) {
    return ctx.dropEvent;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return token.params.realmId;
  }

  public getWebhookEventType(event: any) {
    return 'dataChangeEvent';
  }
}

export { Service };
