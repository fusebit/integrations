import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return event.organizationId;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Linear does not implement HMAC based webhook source validation.
    // However, Linear does provide the IPs that they use to send webhooks, so we will whitelist based on them for now.
    const originIp = ctx.req.headers['x-forwarded-for'] as string | undefined;
    if (!originIp) {
      return false;
    }
    let allowedIps: string[] = ['35.231.147.226', '35.243.134.228'];
    if (ctx.state.manager.config.configuration.allowedIps) {
      allowedIps = ctx.state.manager.config.configuration.allowedIps as string[];
    }
    return allowedIps.includes(originIp);
  }

  protected async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    // Linear does not implement initialization challenge besides that the endpoint returns 200.
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    const query = { query: '{ organization { id } }' };
    const data = await superagent
      .post('https://api.linear.app/graphql')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send(query);
    return data.body.data.organization.id;
  }

  protected getWebhookEventType(event: any): string {
    return event.action;
  }
}

export { Service };
