import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://gitlab.com/oauth/token';
const AUTHORIZATION_URL = 'https://gitlab.com/oauth/authorize';
const REVOCATION_URL = 'https://gitlab.com/oauth/revoke';
const SERVICE_NAME = 'GitLab';
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
        'GitLab Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'webhookSecret');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your GitLab App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your GitLab App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your GitLab App';
      ctx.body.schema.properties.webhookSecret = {
        title: 'Webhook Secret from your GitLab App',
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
