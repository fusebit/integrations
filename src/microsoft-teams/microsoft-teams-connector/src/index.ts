import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const AUTHORIZATION_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const REVOCATION_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/revoke';
const SERVICE_NAME = 'Microsoft Teams';

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
        'Microsoft Teams Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Azure App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Azure App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Azure App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
