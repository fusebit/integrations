import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://driftapi.com/oauth2/token';
const AUTHORIZATION_URL = 'https://dev.drift.com/authorize';
const REVOCATION_URL = 'https://driftapi.com/oauth2/revoke-not-supported';
const SERVICE_NAME = 'Drift';
const PROXY_KEY = 'drift';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, PROXY_KEY);
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Drift Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
