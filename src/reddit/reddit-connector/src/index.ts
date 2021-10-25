import { Connector } from '@fusebit-int/framework';
import { IOAuthConfig, OAuthConnector, OAuthEngine } from '@fusebit-int/oauth-connector';
import superagent from 'superagent';
import { IOAuthToken } from '../../../oauth/oauth-connector/libc/OAuthTypes';

import { Service } from './Service';

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const AUTHORIZATION_URL = 'https://www.reddit.com/api/v1/authorize.compact';
const REVOCATION_URL = 'https://www.reddit.com/api/v1/revoke_token';
const SERVICE_NAME = 'Reddit';

class RedditOAuthEngine extends OAuthEngine {
  /**
   * Reddit expects client id and client secret as the username and password on a basic auth schema.
   */
  public async getAccessToken(authorizationCode: string, ctx: Connector.Types.Context): Promise<IOAuthToken> {
    console.log('==================== yoyoyoyoyoyoyoyoyoyoyo');
    const params = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: this.getRedirectUri(),
    };

    let tokenUrl = this.getTokenUrl(ctx);
    tokenUrl = tokenUrl.replace('://', `://${this.cfg.clientId}:${this.cfg.clientSecret}@`);
    try {
      const response = await superagent.post(tokenUrl).type('form').send(params);
      return response.body;
    } catch (error) {
      throw new Error(`Unable to connect to tokenUrl ${tokenUrl}: ${error}`);
    }
  }
}

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
        'Service Configuration';

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Reddit App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your Reddit App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your Reddit App';
    });
  }

  protected buildOAuthEngine(oauthConfig: IOAuthConfig) {
    return new RedditOAuthEngine(oauthConfig);
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
