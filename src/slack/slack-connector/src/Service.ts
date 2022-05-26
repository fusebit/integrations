import formurlencoded from 'form-urlencoded';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import crypto from 'crypto';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [(ctx.req.body.payload && JSON.parse(ctx.req.body.payload)) || ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
    return `${event.team_id || event.team?.id}/${event.api_app_id}`;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context) {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const timestampHeader = ctx.req.headers['x-slack-request-timestamp'];
    const contentType = ctx.req.headers['content-type'];
    const requestBody = ctx.req.body;

    let rawBody;
    if (contentType?.toLocaleLowerCase() === 'application/x-www-form-urlencoded') {
      // Slash commands are sent in this content type
      rawBody = formurlencoded(requestBody);
    } else {
      rawBody = JSON.stringify(requestBody)
        .replace(/\//g, '\\/')
        .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));
    }

    const basestring = ['v0', timestampHeader, rawBody].join(':');
    const calculatedSignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(basestring).digest('hex');

    const requestSignature = ctx.req.headers['x-slack-signature'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public async initializationChallenge(ctx: Connector.Types.Context) {
    if (ctx.req.body.challenge) {
      ctx.body = { challenge: ctx.req.body.challenge };
      return true;
    }
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    return `${token.team.id}/${token.app_id}`;
  }

  public getWebhookEventType(event: any) {
    if (event.command) {
      // event.command starts with / (e.g., /fusebot), hence not needed after slash-command
      return `slash-command${event.command}`;
    }

    return event.type;
  }

  public async getWebhookTags(ctx: Connector.Types.Context, token: any): Promise<Record<string, string> | void> {
    return {
      app_id: token.app_id,
      team_id: token.team.id,
      user_id: token.authed_user.id,
    };
  }
}

export { Service };
