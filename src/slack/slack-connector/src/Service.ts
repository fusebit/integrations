import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import crypto from 'crypto';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return event.authorizations?.[0]?.user_id;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context) {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const timestampHeader = ctx.req.headers['x-slack-request-timestamp'];
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody)
      .replace(/\//g, '\\/')
      .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

    const basestring = ['v0', timestampHeader, rawBody].join(':');
    const calculatedSignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(basestring).digest('hex');

    const requestSignature = ctx.req.headers['x-slack-signature'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  protected async initializationChallenge(ctx: Connector.Types.Context) {
    if (ctx.req.body.challenge) {
      ctx.body = { challenge: ctx.req.body.challenge };
      return true;
    }
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return token.bot_user_id;
  }

  protected getWebhookEventType(event: any) {
    return event.type;
  }
}

export { Service };
