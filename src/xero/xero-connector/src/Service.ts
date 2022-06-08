import crypto from 'crypto';
import superagent from 'superagent';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return ctx.req.body.events;
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.tenantId;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const requestSignature = ctx.req.headers['x-xero-signature'] as string;
    const body = JSON.stringify(ctx.req.body, null, 3);
    const calculatedSignature = crypto.createHmac('sha256', signingSecret).update(body).digest('hex');
    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');

    const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    if (ctx.req.body.events.length === 0 && ctx.req.body.entropy) {
      return true;
    }
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    // Get the connections, which contains the list of tenants, and use those as ids.
    const connections = await superagent
      .get('https://api.xero.com/connections')
      .set('Authorization', `Bearer ${token.access_token}`);

    return connections.body.map((tenant: { tenantId: string }) => tenant.tenantId);
  }

  public getWebhookEventType(event: any): string {
    return event.eventType;
  }
}

export { Service };
