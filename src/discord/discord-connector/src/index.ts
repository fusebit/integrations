import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const AUTHORIZATION_URL = 'https://discord.com/api/oauth2/authorize';
const REVOCATION_URL = 'https://discord.com/api/oauth2/token/revoke';
const SERVICE_NAME = 'Discord';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

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

    this.router.get('/api/health', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      const { botToken, scope } = ctx.state.manager.config.configuration;
      const hasBotScope = (scope || '').split(' ').includes('bot');

      if (hasBotScope && !botToken) {
        ctx.body = ctx.throw(
          'Missing bot token, ensure the Connector has the Discord Application Bot Token added to your configuration'
        );
      }

      if (!hasBotScope && botToken) {
        ctx.body = ctx.throw('Missing scope, ensure the Connector bot scope is added to your configuration');
      }

      next();
    });

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Discord Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'botToken', 'password');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'applicationPublicKey');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'extraParams');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'applicationId');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Discord App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Discord App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Discord App';
      ctx.body.schema.properties.botToken = {
        title: 'Discord Application Bot Token',
        type: 'string',
      };
      ctx.body.schema.properties.applicationPublicKey = {
        title: 'Discord Public Key',
        type: 'string',
      };
      ctx.body.schema.properties.extraParams = {
        title: 'Bot Permissions',
        type: 'string',
      };
      ctx.body.schema.properties.applicationId = {
        title: 'Application Id',
        type: 'string',
      };
    });

    // Expose the applicationId to the credentials so it can be used from the integration.
    this.router.get('/api/:lookupKey/token', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      ctx.body.applicationId = ctx.state.manager.config.configuration.applicationId;
      return next();
    });

    // Expose bot token endpoint to get the stored bot token in the connector
    this.router.get(
      '/api/bot-token',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        ctx.body = {
          botToken: ctx.state.manager.config.configuration.botToken,
        };
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
