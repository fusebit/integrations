import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [{ data: ctx.req.body, type: ctx.req.body.event_name }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return event.data.user_id;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const webhookSecret = ctx.req.headers['x-gitlab-token'] as string;
    return webhookSecret === ctx.state.manager.config.configuration.webhookSecret;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const data = await superagent
      .get('https://gitlab.com/api/v4/user/')
      .set('Authorization', `Bearer ${token.access_token}`);
    return data.body.id;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
