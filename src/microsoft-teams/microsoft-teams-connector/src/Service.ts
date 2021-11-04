import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';

class Service extends OAuthConnector.Service {
  protected getEventsFromPayload(ctx: Connector.Types.Context) {
    const eventPayload = {
      botFrameworkConfig: {
        clientId: ctx.state.manager.config.configuration.clientId,
        accessToken: ctx.botFrameworkAccessToken,
        botAuth: ctx.headers.authorization,
      },
      teamsEvent: ctx.req.body,
    };
    return [eventPayload];
  }

  protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any): string {
    return ctx.req.body.from.aadObjectId;
  }

  protected async validateWebhookEvent(ctx: Connector.Types.Context) {
    /**
     * TODO - Follow the steps here:
     * https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication?view=azure-bot-service-4.0#openid-metadata-document
     *
     * This will require an async validateWebhookEvent to fetch jwks and the like
     *
     */

    const botFrameworkCredentialsResponse = await superagent
      .get('https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token')
      .type('form')
      .send({
        grant_type: 'client_credentials',
        client_id: ctx.state.manager.config.configuration.clientId,
        client_secret: ctx.state.manager.config.configuration.clientSecret,
        scope: 'https://api.botframework.com/.default',
      });

    ctx.botFrameworkAccessToken = botFrameworkCredentialsResponse.body.access_token;

    return true;
  }

  protected initializationChallenge(ctx: Connector.Types.Context): boolean {
    return false;
  }

  protected async getTokenAuthId(ctx: Connector.Types.Context, token: any): Promise<string | void> {
    const response = await superagent
      .get('https://graph.microsoft.com/v1.0/me')
      .set('Authorization', `Bearer ${token.access_token}`);
    return response.body.id;
  }

  protected getWebhookEventType({ teamsEvent }: any): string {
    return teamsEvent.type;
  }
}

export { Service };
