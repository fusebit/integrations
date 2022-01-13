import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';
import QuickBooksOAuthEngine from './Engine';

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const AUTHORIZATION_URL = 'https://appcenter.intuit.com/connect/oauth2';
const REVOCATION_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const SERVICE_NAME = 'QuickBooks';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector {
  static Service = Service;
  protected readonly OAuthEngine = QuickBooksOAuthEngine;

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
        'QuickBooks Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your QuickBooks App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your QuickBooks App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your QuickBooks App';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'verifierToken', 'password');
      ctx.body.schema.properties.verifierToken = {
        title: `Webhook Verifier Token from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
