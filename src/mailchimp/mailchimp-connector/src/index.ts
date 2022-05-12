import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.mailchimp.com/oauth2/token';
const AUTHORIZATION_URL = 'https://login.mailchimp.com/oauth2/authorize';
// Mailchimp does not implement a revocation URL, this is just a placeholder.
const REVOCATION_URL = 'https://login.mailchimp.com/oauth2/token/no_supported';
const SERVICE_NAME = 'Mailchimp';

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
        'Mailchimp Configuration';

      // Adjust the ui schema and layout
      // The server prefix is part of the URL of the specific Mailchimp account that owns the OAuth Application.
      this.addConfigurationElement(ctx, SERVICE_NAME.toLocaleLowerCase(), 'serverPrefix');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.scope.serverPrefix =
        'The value of the server prefix located in the Mailchimp account URL';
    });

    this.router.get(
      '/api/oauth/metadata',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        const prefix = ctx.state.manager.config.configuration.serverPrefix;
        ctx.body = prefix;
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
