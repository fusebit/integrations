import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/token';
const AUTHORIZATION_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/authorize';
const REVOCATION_URL = 'https://graph.microsoft.com/v1.0/me/revokeSignInSessions';
const SERVICE_NAME = 'Microsoft Dynamics';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';
class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  protected async runExtraConfiguration(ctx: Connector.Types.Context) {
    await this.service.configure(ctx, ctx.state.tokenInfo);
  }

  public constructor() {
    super();
    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Microsoft Dynamics Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'tenant');
      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.tenant = {
        title: `Tenant from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });

    const Joi = this.middleware.validate.joi;

    // Webhook management
    this.router.delete(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
      }
    );

    this.router.patch(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx, ctx.params.organizationId);
      }
    );

    this.router.get(
      '/api/webhook/:organizationId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.getWebhook(ctx, ctx.params.organizationId);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
