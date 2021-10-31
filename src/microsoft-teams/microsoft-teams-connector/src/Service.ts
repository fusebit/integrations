import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return ctx.req.body.from.aadObjectId;
  }

  protected validateWebhookEvent(ctx: Connector.Types.Context): boolean {
    /**
     * TODO - Follow the steps here:
     * https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication?view=azure-bot-service-4.0#openid-metadata-document
     *
     * This will require an async validateWebhookEvent to fetch jwks and the like
     *
     */

    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    // TODO - no initializationChallenge?
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    console.log(token.access_token);
    const response = await superagent
      .get('https://graph.microsoft.com/v1.0/me')
      .set('Authorization', `Bearer ${token.access_token}`);
    console.log(response.body);
    return response.body.id;
  }

  protected getWebhookEventType(event: any): string {
    return event.type;
  }
}

export { Service };
