import superagent from 'superagent';
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.meta.host;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Security is not something pipedrive believes in
    return true;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const resp = await superagent
      .get('https://api.pipedrive.com/v1/users/me')
      .set('Authorization', `Bearer ${token.access_token}`)
      .send();

    return resp.body.company_domain;
  }

  public getWebhookEventType(event: any): string {
    return event.event;
  }
}

export { Service };
