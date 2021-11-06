import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import { Service } from './Service';

const TOKEN_URL = 'https://app.asana.com/-/oauth_token';
const AUTHORIZATION_URL = 'https://app.asana.com/-/oauth_authorize';
const REVOCATION_URL = 'https://app.asana.com/-/oauth_revoke';
const SERVICE_NAME = 'Asana';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL);
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Service Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Asana App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Asana App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Asana App';
    });

    this.router.post(
      '/api/fusebit/webhook/create',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.post('/api/fusebit/webhook/event/:webhookId', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });
  }
}

const connector = new ServiceConnector();
export default connector;
export { ServiceConnector };
