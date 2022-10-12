import { Connector } from '@fusebit-int/framework';
import { IOAuthToken, OAuthConnector, OAuthEngine } from '@fusebit-int/oauth-connector';
import MicrosoftGraphOAuthEngine from './Engine';

import { Service } from './Service';
import * as Types from './types';

const TOKEN_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/token';
const AUTHORIZATION_URL = 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/authorize';
const REVOCATION_URL = 'https://graph.microsoft.com/v1.0/me/revokeSignInSessions';
const SERVICE_NAME = 'Microsoft Graph';
const PROXY_KEY = 'microsoftgraph';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;
  protected readonly OAuthEngine = MicrosoftGraphOAuthEngine;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, PROXY_KEY);
  }

  protected async runExtraConfiguration(ctx: Connector.Types.Context, token: IOAuthToken) {
    await this.service.configure(ctx, token);
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'tenant');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'privateKey');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'publicKey');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.tenant = {
        title: `Tenant from your ${SERVICE_NAME} App`,
        type: 'string',
      };
      ctx.body.schema.properties.privateKey = {
        title: 'Private key used to decrypt resource data',
        type: 'string',
      };
      ctx.body.schema.properties.publicKey = {
        title: 'Public key used to encrypt resource data',
        type: 'string',
      };
    });

    const Joi = this.middleware.validate.joi;

    // Webhook management
    this.router.post(
      '/api/webhook/:tenantId',
      this.middleware.validate({
        body: Joi.object({
          changeType: Joi.string().required(),
          resource: Joi.string().required(),
          expirationDateTime: Joi.string().required(),
          accessToken: Joi.string().required(),
          includeResourceData: Joi.bool().optional().default(false),
          useBeta: Joi.bool().optional().default(false),
          notificationQueryOptions: Joi.string().optional(),
          lifecycleNotificationUrl: Joi.string().uri().optional(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        const { privateKey, publicKey } = ctx.state.manager.config.configuration;
        const { includeResourceData } = ctx.req.body;
        if (includeResourceData) {
          if (!publicKey || !privateKey) {
            return ctx.throw(
              'Missing a key-pair required to include resource data in notification payload, ensure you have properly configured a private and public key',
              400
            );
          }
        }
        ctx.body = await this.service.registerWebhook(ctx, ctx.params.tenantId, ctx.req.body);
      }
    );

    this.router.patch(
      '/api/webhook/:subscriptionId',
      this.middleware.validate({
        body: Joi.object({
          expirationDateTime: Joi.string().required(),
          accessToken: Joi.string().required(),
        }),
      }),
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.updateWebhook(ctx, ctx.params.subscriptionId, ctx.req.body);
      }
    );

    this.router.delete(
      '/api/webhook/:subscriptionId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.deleteWebhook(ctx, ctx.params.subscriptionId, ctx.req.body);
      }
    );

    this.router.get(
      '/api/webhook/:subscriptionId',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.getWebhook(ctx, ctx.params.subscriptionId, ctx.req.body);
      }
    );

    this.router.get(
      '/api/webhook',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = await this.service.listWebhooks(ctx, ctx.req.body);
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector, Types };
