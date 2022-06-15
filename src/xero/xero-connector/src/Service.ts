import crypto from 'crypto';
import superagent from 'superagent';

import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

interface IXeroEvent {
  resourceUrl: string;
  resourceId: string;
  eventDateUtc: string;
  eventType: string;
  eventCategory: string;
  tenantId: string;
  tenantType: string;
}

interface IXeroEventBody {
  events: IXeroEvent[];
  firstEventSequence: number;
  lastEventSequence: number;
  entropy: string;
}

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return ctx.req.body.events;
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.tenantId;
  }

  protected eventToString(event: IXeroEvent) {
    return `{\n  "resourceUrl": "${event.resourceUrl}",\n  "resourceId": "${event.resourceId}",\n  "eventDateUtc": "${event.eventDateUtc}",\n  "eventType": "${event.eventType}",\n  "eventCategory": "${event.eventCategory}",\n  "tenantId": "${event.tenantId}",\n  "tenantType": "${event.tenantType}"\n}`;
  }

  protected bodyToString(body: IXeroEventBody) {
    return `{"events":[${body.events.map((event) => this.eventToString(event)).join(',')}],"firstEventSequence": ${
      body.firstEventSequence
    },"lastEventSequence": ${body.lastEventSequence}, "entropy": "${body.entropy}"}`;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const requestSignature = ctx.req.headers['x-xero-signature'] as string;
    const body = ctx.req.body;

    // Convert the body to a string:
    const bodyString = this.bodyToString(body);

    const calculatedSignature = crypto.createHmac('sha256', signingSecret).update(bodyString).digest('base64');
    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');

    const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');

    const result = crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);

    // Xero has specific requirements about the return code: it must be 401, and there must be no body.
    if (!result) {
      ctx.throw(401, { hideBody: true });
    }

    return true;
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
