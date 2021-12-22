import superagent from 'superagent';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any {
    const event = ctx.req.headers['x-github-event'];
    const action = ctx.req.body.action || ctx.req.body.ref_type;
    const type = `${event}.${action}`;
    return [{ data: ctx.req.body, type }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.data.installation.id;
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
    // Since GitHub supports installing an Application to Multiple Orgs, we fetch the
    // installations endpoint in order to register an AuthId to each Org.
    const installationsResponse = await superagent
      .get('https://api.github.com/user/installations')
      .set('User-Agent', `fusebit/${ctx.state.params.entityId}`)
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Accept', 'application/vnd.github.v3+json');
    const { total_count, installations } = installationsResponse.body;

    if (total_count) {
      return installations.map((installation: any) => installation.id);
    }
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
