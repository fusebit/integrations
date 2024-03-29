import superagent from 'superagent';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any {
    const event = ctx.req.headers['x-github-event'];
    const type = `${event}.${ctx.req.body.action}`;
    return [{ data: ctx.req.body, type }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event?.data?.sender?.id;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const payload = ctx.req.body;
    const signatureHeader = ctx.req.headers['x-hub-signature-256'] as string;
    if (payload && signatureHeader) {
      const requestBody = JSON.stringify(payload);
      const signatureBuffer = Buffer.from(signatureHeader);
      const signingAlgorithm = 'sha256';
      const sign = `${signingAlgorithm}=${crypto
        .createHmac(signingAlgorithm, ctx.state.manager.config.configuration.signingSecret)
        .update(requestBody)
        .digest('hex')}`;
      const verificationBuffer = Buffer.from(sign);
      if (signatureBuffer.length !== verificationBuffer.length) {
        return false;
      }
      const isValid = crypto.timingSafeEqual(signatureBuffer, verificationBuffer);
      return isValid;
    }
    return false;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const userResponse = await superagent
      .get('https://api.github.com/user')
      .set('User-Agent', `fusebit/${ctx.state.params.entityId}`)
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Accept', 'application/vnd.github.v3+json');
    return userResponse?.body?.id;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
