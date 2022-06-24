import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SERVICE_NAME = 'Salesforce';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  protected createService() {
    return new ServiceConnector.Service();
  }

  constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientId.description = `The OAuth Consumer Key from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientSecret.description = `The Consumer Secret from your ${SERVICE_NAME} Connected App`;
    });

    const Joi = this.middleware.validate.joi;

    /**
     * Create a new Salesforce Webhook (Apex Trigger)
     */
    this.router.post(
      '/api/webhook',
      this.middleware.validate({
        body: Joi.object({
          entityId: Joi.string().required(),
          events: Joi.array()
            .items(
              Joi.string().valid(
                'before insert',
                'before update',
                'before delete',
                'after insert',
                'after update',
                'after delete',
                'after undelete'
              )
            )
            .min(1),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.createWebhook(ctx);
      }
    );

    /**
     * List created Webhooks schema
     */
    this.router.get(
      '/api/webhook',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.listWebhooksSchema(ctx);
      }
    );

    /**
     * List created Webhooks schema
     */
    this.router.get(
      '/api/webhook/configure',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.checkWebhookConfiguration(ctx);
      }
    );

    /**
     * Configure Webhooks for Salesforce development instance
     */
    this.router.post(
      '/api/webhook/configure',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.enableWebhooksForDevelopment(ctx);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
