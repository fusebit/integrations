import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REVOCATION_URL = 'https://oauth2.googleapis.com/revoke';
const SERVICE_NAME = 'Google';
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
        'Google Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'callbackUrl');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Google App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Google App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Google App';

      ctx.body.schema.properties.callbackUrl = {
        title: 'Callback URL',
        description: 'URL on your domain that redirects back to /api/callback',
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
