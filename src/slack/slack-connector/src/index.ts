import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import crypto from 'crypto';

const TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const AUTHORIZATION_URL = 'https://slack.com/oauth/v2/authorize';
const SERVICE_NAME = 'Slack';

class Service extends OAuthConnector.Service {
  public getEventsFromPayload(ctx: Connector.Types.Context) {
    return [ctx.req.body];
  }

  public getAuthIdFromEvent(event: any) {
    return event.authorizations?.[0]?.user_id;
  }

  public validateWebhookEvent(ctx: Connector.Types.Context) {
    const signingSecret = ctx.state.manager.config.configuration.signingSecret;
    const timestampHeader = ctx.req.headers['x-slack-request-timestamp'];
    const requestBody = ctx.req.body;
    const rawBody = JSON.stringify(requestBody)
      .replace(/\//g, '\\/')
      .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

    const basestring = ['v0', timestampHeader, rawBody].join(':');
    const calculatedSignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(basestring).digest('hex');

    const requestSignature = ctx.req.headers['x-slack-signature'] as string;

    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
    const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');
    return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
  }

  public initializationChallenge(ctx: Connector.Types.Context) {
    if (ctx.req.body.challenge) {
      ctx.body = { challenge: ctx.req.body.challenge };
      return true;
    }
    return false;
  }

  public async getTokenAuthId(ctx: Connector.Types.Context, token: any) {
    return token.bot_user_id;
  }

  public getWebhookEventType(event: any) {
    return event.type;
  }
}

class ServiceConnector extends OAuthConnector {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  public constructor() {
    super();
    const router = this.router;

    // Update the configuration that OAuthConnector primes with service specific things
    router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the ui schema and layout
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;
      ctx.body.uischema.elements
        .find((element: { label: string }) => element.label == 'Fusebit Connector Configuration')
        .elements[0].elements[1].elements.push({
          type: 'Control',
          scope: '#/properties/signingSecret',
          options: {
            format: 'password',
          },
        });

      // Adjust the data schema
      ctx.body.schema.properties.constants.properties.urls.properties.webhookUrl.title = 'Events API Request URL';
      ctx.body.schema.properties.scope.title = 'Bot Token Scopes (space separated)';
      ctx.body.schema.properties.clientId.title = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.title = `The Client Secret from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.signingSecret = {
        title: `Signing Secret from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
