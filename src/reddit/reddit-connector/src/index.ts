import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import RedditOAuthEngine from './Engine';

import { Service } from './Service';

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const AUTHORIZATION_URL = 'https://www.reddit.com/api/v1/authorize';
const REVOCATION_URL = 'https://www.reddit.com/api/v1/revoke_token';
const SERVICE_NAME = 'Reddit';

class ServiceConnector extends OAuthConnector {
  protected readonly OAuthEngine = RedditOAuthEngine;
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
        'Reddit Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Reddit App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Reddit App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Reddit App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
