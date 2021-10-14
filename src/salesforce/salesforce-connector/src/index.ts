import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SERVICE_NAME = 'Salesforce';

class ServiceConnector extends OAuthConnector {
  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientId.description = `The OAuth Consumer Key from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientSecret.description = `The Consumer Secret from your ${SERVICE_NAME} Connected App`;
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
