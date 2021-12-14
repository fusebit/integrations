import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://stackoverflow.com/oauth/access_token';
const AUTHORIZATION_URL = 'https://stackoverflow.com/oauth';
const REVOCATION_URL = 'https://stackoverflow.com/oauth/unsupported';
const SERVICE_NAME = 'StackOverflow';

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

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your StackOverflow App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your StackOverflow App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your StackOverflow App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
