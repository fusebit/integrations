import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const AUTHORIZATION_URL = 'https://twitter.com/i/oauth2/authorize';
const REVOCATION_URL = 'https://twitter.com/i/oauth2/invalidate_token';
const SERVICE_NAME = 'Twitter';

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
        'Twitter Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Twitter App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Twitter App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Twitter App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
