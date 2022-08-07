import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';
import { schema, uischema } from './configure/webhooks';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SERVICE_NAME = 'Salesforce';
const CONFIGURATION_SECTION = 'Fusebit Connector Configuration';

class ServiceConnector extends OAuthConnector<Service> {
  static Service = Service;

  protected addUrlConfigurationAdjustment(): Connector.Types.Handler {
    return this.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, SERVICE_NAME.toLowerCase());
  }

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected async handleCallback(ctx: Connector.Types.Context) {
    const { webhooks } = ctx.state.manager.config.configuration.splash || {};
    // Webhooks only works in production mode.
    ctx.state.displaySplash = webhooks?.length && ctx.state.manager.config.configuration.mode?.useProduction;
    await super.handleCallback(ctx);
  }

  protected async handleSplashScreen(ctx: Connector.Types.Context) {
    await this.service.configure(ctx, ctx.state.tokenInfo);
  }

  constructor() {
    super();
    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find(
        (element: { label: string }) => element.label == 'OAuth2 Configuration'
      ).label = `${SERVICE_NAME} Configuration`;

      // Adjust Webhooks configuration screen
      ctx.body.schema.properties.splash = schema;
      ctx.body.uischema.elements.push(uischema);

      // Adjust the data schema
      ctx.body.schema.properties.scope.description = `Space separated scopes to request from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientId.description = `The OAuth Consumer Key from your ${SERVICE_NAME} Connected App`;
      ctx.body.schema.properties.clientSecret.description = `The Consumer Secret from your ${SERVICE_NAME} Connected App`;
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
