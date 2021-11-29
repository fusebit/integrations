import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const AUTHORIZATION_URL = 'https://discord.com/api/oauth2/authorize';
const REVOCATION_URL = 'https://discord.com/api/oauth2/token/revoke';
const SERVICE_NAME = 'Discord';

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

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Discord Configuration';

      ctx.body.uischema.elements
        .find((element: { label: string }) => element.label == 'Fusebit Connector Configuration')
        .elements[0].elements[1].elements.push({
          type: 'Control',
          scope: '#/properties/botToken',
          options: {
            format: 'password',
          },
        });

      ctx.body.uischema.elements
        .find((element: { label: string }) => element.label == 'Fusebit Connector Configuration')
        .elements[0].elements[1].elements.push({
          type: 'Control',
          scope: '#/properties/applicationPublicKey',
        });

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Discord App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Discord App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Discord App';
      ctx.body.schema.properties.botToken = {
        title: 'Discord Application Bot Token',
        type: 'string',
      };
      ctx.body.schema.properties.botToken = {
        title: 'Discord Public Key',
        type: 'string',
      };
    });

    // Expose bot token endpoint to get the stored bot token in the connector
    this.router.get(
      '/api/bot/check',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        const hasBotScope = ctx.state.manager.config.configuration.scope.split(' ').includes('bot');
        ctx.body = {
          hasBotScope,
          botToken: ctx.state.manager.config.configuration.botToken,
        };
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
