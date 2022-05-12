import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return '';
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    const agent = ctx.req.headers['user-agent'] as string | undefined;

    if (!agent) {
      return false;
    }

    const validUserAgents = ['MailChimp.com WebHook Validator', 'MailChimp'];

    return validUserAgents.includes(agent);
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    const data = await superagent
      .get('https://login.mailchimp.com/oauth2/metadata')
      .set('Authorization', `Bearer ${token.access_token}`);
    return data.body.data;
  }

  public getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
