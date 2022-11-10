import { Connector } from '@fusebit-int/framework';
import { IFusebitContext } from '@fusebit-int/framework/libc/router';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = '{{baseUrl}}/oauth/token';
const AUTHORIZATION_URL = '{{baseUrl}}/oauth/authorize';
const REVOCATION_URL = '{{baseUrl}}/oauth/revoke';
const SERVICE_NAME = 'Mastodon';
const PROXY_KEY = 'mastodon';
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

  protected enhanceTokenResponse(ctx: IFusebitContext, token: any): Promise<any> {
    token.baseUrl = ctx.state.manager.config.configuration.baseUrl;
    return token;
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        'Mastodon Configuration';

      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'baseUrl');

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
