import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://stackoverflow.com/oauth/access_token';
const AUTHORIZATION_URL = 'https://stackoverflow.com/oauth';
const REVOCATION_URL = 'https://stackoverflow.com/oauth/unsupported';
const SERVICE_NAME = 'StackOverflow';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector {
  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'StackOverflow Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'clientKey');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your StackOverflow App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your StackOverflow App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your StackOverflow App';
      ctx.body.schema.properties.clientKey = { description: 'Client Key', type: 'string' };
    });

    // Add the Client Key, which is used to control quotas, in Stack Overflow.
    this.router.get('/api/:lookupKey/token', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
      await next();

      // If the OAuth server supplies it (for example, via the proxy) then use that value instead of the
      // configured value.
      ctx.body.client_key = ctx.body.client_key || ctx.state.manager.config.configuration.clientKey;
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
