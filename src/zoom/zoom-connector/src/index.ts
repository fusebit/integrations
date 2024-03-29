import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://zoom.us/oauth/token';
const AUTHORIZATION_URL = 'https://zoom.us/oauth/authorize';
const REVOCATION_URL = 'https://zoom.us/oauth/revoke';
const SERVICE_NAME = 'Zoom';
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

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Zoom Configuration';

      // Add webhook secret into schema.
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'webhookSecret', 'password');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Comma separated scopes to request from your Zoom App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Zoom App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Zoom App';
      ctx.body.schema.properties.webhookSecret = {
        title: 'Zoom Webhook Secret',
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
