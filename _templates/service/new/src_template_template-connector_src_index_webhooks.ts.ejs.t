---
to: "<%= connector.tokenUrl && includeWebhooks ? `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` : null %>"
---
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = '<%= connector.tokenUrl%>';
const AUTHORIZATION_URL = '<%= connector.authorizationUrl %>';
const REVOCATION_URL = '<%= connector.revokeUrl %>';
const SERVICE_NAME = '<%= h.capitalize(name) %>';
const PROXY_KEY = '<%= h.changeCase.lower(h.changeCase.camel(name)) %>';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, PROXY_KEY);
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        '<%= h.capitalize(name) %> Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
    });

    // TODO: Implement proper Webhook Schema validation
    const Joi = this.middleware.validate.joi;

    // Webhook management
    this.router.post(
      '/api/webhook',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.patch(
      '/api/webhook/:id',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx);
      }
    );

    this.router.delete(
      '/api/webhook/:id',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
      }
    );

    this.router.get(
      '/api/webhook/:id',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.getWebhook(ctx);
      }
    );

    this.router.get(
      '/api/webhook',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.listWebhooks(ctx);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
