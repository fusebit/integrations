import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const AUTHORIZATION_URL = 'https://slack.com/oauth/v2/authorize';
const SERVICE_NAME = 'Slack';

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

    // Update the configuration that OAuthConnector primes with service specific things
    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the ui schema and layout
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;
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
      ctx.body.schema.properties.constants.properties.urls.properties.webhookUrl.title = 'Events API Request URL';
      ctx.body.schema.properties.scope.title = 'Bot Token Scopes (space separated)';
      ctx.body.schema.properties.clientId.title = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.title = `The Client Secret from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.signingSecret = {
        title: `Signing Secret from your ${SERVICE_NAME} App`,
        type: 'string',
      };
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
