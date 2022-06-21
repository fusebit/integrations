import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://oauth.pipedrive.com/oauth/token';
const AUTHORIZATION_URL = 'https://oauth.pipedrive.com/oauth/authorize';
const REVOCATION_URL = 'https://oauth.pipedrive.com/oauth/revoke-not-supported';
const SERVICE_NAME = 'Pipedrive';
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
        'Pipedrive Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
    });

    const Joi = this.middleware.validate.joi;

    this.router.post(
      '/api/fusebit/webhook',
      this.middleware.authorizeUser('connector:execute'),
      this.middleware.validate({
        body: Joi.object({
          access_token: Joi.string().required(),
          args: Joi.object({
            user_id: Joi.string(),
            event_object: Joi.string().required(),
            event_action: Joi.string().required(),
          }).required(),
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.registerWebhook(ctx);
      }
    );

    this.router.delete(
      '/api/fusebit/webhook/:webhookId',
      this.middleware.authorizeUser('connector:execute'),
      this.middleware.validate({
        body: Joi.object({
          access_token: Joi.string().required(),
          // This is a Pipedrive webhookId, thus not a UUID like a Fusebit webhookId
          webhookId: Joi.string().required(),
          args: Joi.object().required(),
        }),
        params: Joi.object({
          webhookId: Joi.string().uuid({ version: 'uuidv4' }).required(),
        }),
      }),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx);
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
