import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.mailchimp.com/oauth2/token';
const AUTHORIZATION_URL = 'https://login.mailchimp.com/oauth2/authorize';
// Mailchimp does not implement a revocation URL, this is just a placeholder.
const REVOCATION_URL = 'https://login.mailchimp.com/oauth2/token/not_supported';
const SERVICE_NAME = 'Mailchimp';
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

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Mailchimp Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
    });

    const Joi = this.middleware.validate.joi;

    // Webhook management
    this.router.post(
      '/api/fusebit/webhook/create',
      this.middleware.validate({
        body: Joi.object({
          secret: Joi.string().alphanum().optional(),
          webhookId: Joi.string().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.delete(
      '/api/fusebit/webhook/:webhookId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
      }
    );

    this.router.patch(
      '/api/fusebit/webhook/:webhookId',
      this.middleware.validate({
        body: Joi.object({ secret: Joi.string().alphanum().optional() }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx);
      }
    );

    this.router.post('/api/fusebit/webhook/event/:webhookId', async (ctx: Connector.Types.Context) => {
      await this.service.handleWebhookEvent(ctx);
    });

    // Handle Webhook ping (only used at the configuration of the Webhook)
    this.router.get('/api/fusebit/webhook/event/:webhookId', async (ctx: Connector.Types.Context) => {
      if (!this.service.isPingWebhook(ctx)) {
        return (ctx.status = 404);
      }
      ctx.status = 200;
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
