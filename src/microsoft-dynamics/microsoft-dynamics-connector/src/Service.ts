import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context): any[] | void {
    return [{ ...ctx.req.body }];
  }

  public getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string | void {
    return `organization/${event.OrganizationId}`;
  }

  public async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    // Webhook Validation for Microsoft Dynamics isn't sophisticated, for now, we expect
    // The Organization Id encoded in base64 as the secret coming from the following mechanisms:
    // HttpHeader, WebhookKey, HttpQueryString
    const secret = ctx.query.secret || ctx.query.code || ctx.headers['secret'];
    if (!secret) {
      return false;
    }
    const decodedOrganizationId = Buffer.from(secret, 'base64').toString('utf-8');
    return decodedOrganizationId === ctx.req.body.OrganizationId;
  }

  public async initializationChallenge(ctx: Connector.Types.Context): Promise<boolean> {
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | string[] | void> {
    // Replace the Dynamics API Permission to get the server root
    const serverUrl = `${token.scope.replace('/user_impersonation', '')}/api/data/v9.2/WhoAmI`;
    const instanceResponse = await superagent
      .get(serverUrl)
      .set('Authorization', `Bearer ${token.access_token}`)
      .set('Accept', 'application/json');
    const { OrganizationId, UserId } = instanceResponse.body;
    return [`organization/${OrganizationId}`, `user/${UserId}`];
  }

  public getWebhookEventType(event: any): string {
    return `${event.PrimaryEntityName}:${event.MessageName}`.toLowerCase();
  }
}

export { Service };
