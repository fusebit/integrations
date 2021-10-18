import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://api.linear.app/oauth/token';
const AUTHORIZATION_URL = 'https://linear.app/oauth/authorize';
const SERVICE_NAME = 'Linear';

class ServiceConnector extends OAuthConnector {
  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Linear Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Linear App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Linear App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Linear App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
