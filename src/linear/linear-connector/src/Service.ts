import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(event: any): string {
    return event.organizationId;
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    // Linear does not implement HMAC based webhook source validation.
    // Best to assume all webhooks are legit for now.
    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    // Linear does not implement initialization challenge besides that the endpoint returns 200.
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    console.log('invoked');
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
