import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://login.mailchimp.com/oauth2/token';
const AUTHORIZATION_URL = 'https://login.mailchimp.com/oauth2/authorize';
// Mailchimp does not implement a revocation URL, this is just a placeholder.
const REVOCATION_URL = 'https://login.mailchimp.com/oauth2/token/no_supported';
const SERVICE_NAME = 'Mailchimp';

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
        'Mailchimp Configuration';

      // Adjust the ui schema and layout

      // Mailchimp offers two official APIs: Transactional and Marketing, supporting different use cases.
      // Marketing API is authenticated using an OAuth Access Token.
      // Transactional API is authenticated only via API Key - Most of the cases Marketing API is enough -
      // Certain endpoints are only supported in the Transactional API.
      // Transactional API is more suitable for single tenancy applications since it requires an API Key.
      this.addConfigurationElement(ctx, SERVICE_NAME.toLocaleLowerCase(), 'transactionalApiKey', 'password');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your ${SERVICE_NAME} App';
      ctx.body.schema.properties.transactionalApiKey = {
        title: 'API Key for the Mailchimp transactional API',
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
