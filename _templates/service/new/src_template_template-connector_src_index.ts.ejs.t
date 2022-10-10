---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/src/index.ts
---
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

import { Service } from './Service';

const TOKEN_URL = '<%= connector.tokenUrl %>';
const AUTHORIZATION_URL = '<%= connector.authorizationUrl %>';
const REVOCATION_URL = '<%= connector.revokeUrl %>';
const SERVICE_NAME = '<%= h.capitalize(name) %>';
const PROXY_KEY = '<%= h.changeCase.lower(h.changeCase.camel(name)) %>';
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

  public constructor() {
    super();

    this.router.get('/api/configure', async (ctx: Connector.Types.Context) => {
      // Adjust the configuration elements here
      ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
        '<%= h.capitalize(name) %> Configuration';

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
