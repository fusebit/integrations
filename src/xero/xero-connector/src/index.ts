import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://identity.xero.com/connect/token';
const AUTHORIZATION_URL = 'https://login.xero.com/identity/connect/authorize';
const REVOCATION_URL = 'https://identity.xero.com/connect/revocation';
const SERVICE_NAME = 'Xero';
// Configuration section name used to add extra configuration elements via this.addConfigurationElement
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

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

    this.router.post('/api/fusebit/webhook/event', async (ctx: Connector.Types.Context, next: any) => {
      console.log(`Event Payload: ${JSON.stringify(ctx.req.body, null, 2)}`);
      return next();
    });

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Xero Configuration';
      ctx.body.uischema.elements
        .find((element: { label: string }) => element.label == 'Fusebit Connector Configuration')
        .elements[0].elements[1].elements.push({
          type: 'Control',
          scope: '#/properties/signingSecret',
          options: {
            format: 'password',
          },
        });

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.signingSecret = {
        title: `Webhooks key from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
