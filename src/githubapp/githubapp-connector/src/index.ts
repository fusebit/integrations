import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import jwt from 'jsonwebtoken';

import { Service } from './Service';

const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const AUTHORIZATION_URL = 'https://github.com/apps/{{applicationName}}/installations/new';
const REVOCATION_URL = 'https://api.github.com/applications/CLIENT_ID/token';
const SERVICE_NAME = 'GitHubApp';
const HUMAN_SERVICE_NAME = 'GitHub';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase(), ['applicationName']);
  }

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${HUMAN_SERVICE_NAME} Configuration`;

      // Adjust the ui schema and layout
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'applicationId');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'signingSecret', 'password');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'privateKey', 'password');
      this.addConfigurationElement(ctx, CONFIGURATION_SECTION, 'applicationName');

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${HUMAN_SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${HUMAN_SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${HUMAN_SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.title = `The Client Secret from your ${HUMAN_SERVICE_NAME} App`;
      ctx.body.schema.properties.signingSecret = {
        title: `Webhook Secret from your ${HUMAN_SERVICE_NAME} App`,
        type: 'string',
      };
      ctx.body.schema.properties.privateKey = {
        title: `Private Secret from your ${HUMAN_SERVICE_NAME} App`,
        type: 'string',
      };
      ctx.body.schema.properties.applicationId = {
        title: `App ID from your ${HUMAN_SERVICE_NAME} App`,
        type: 'string',
      };
      ctx.body.schema.properties.applicationName = {
        title: `App name from your ${HUMAN_SERVICE_NAME} App`,
        type: 'string',
      };
    });

    this.router.get(
      '/api/token/app',
      this.middleware.authorizeUser('connector:execute'),
      async (ctx: Connector.Types.Context) => {
        const privateKey = ctx.state.manager.config.configuration.privateKey;

        if (!privateKey) {
          ctx.throw(500, 'Missing Private Secret for sign access token requests');
        }

        if (!ctx.state.manager.config.configuration.applicationId) {
          ctx.throw(500, 'Missing App ID');
        }

        // Ideally the private key section should render as a textarea, but since this is a secret,
        // we may need to add some extra work to support hiding the value from it, hence we need to add back the new lines.
        const formattedKey = privateKey
          .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN RSA PRIVATE KEY-----\n')
          .replace('-----END RSA PRIVATE KEY-----', '\n-----END RSA PRIVATE KEY-----');
        const payload = {
          iat: Math.floor(Date.now() / 1000) - 60, // issued at time, 60 seconds in the past to allow for clock drift
          exp: Math.floor(Date.now() / 1000) + 60 * 10, // JWT expiration time (10 minutes maximum)
          iss: ctx.state.manager.config.configuration.applicationId,
        };
        const response = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });
        ctx.body = {
          jwt: response,
          expiresAt: payload.exp * 1000, // set expiration in ms
        };
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
