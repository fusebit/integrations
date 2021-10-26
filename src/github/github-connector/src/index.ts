import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';
const SERVICE_NAME = 'GitHub';

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
      // Adjust the ui schema and layout
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
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientId.description = `The Client ID from your ${SERVICE_NAME} App`;
      ctx.body.schema.properties.clientSecret.description = `The Client Secret from your ${SERVICE_NAME} App`;
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
