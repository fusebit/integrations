import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const REVOCATION_URL = 'https://www.linkedin.com/oauth/v2/revoke';
const SERVICE_NAME = 'LinkedIn';

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
        'LinkedIn Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your LinkedIn App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your LinkedIn App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your LinkedIn App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
