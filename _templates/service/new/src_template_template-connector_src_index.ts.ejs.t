---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/src/index.ts
---
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';

const TOKEN_URL = '<%= connector.tokenUrl %>';
const AUTHORIZATION_URL = '<%= connector.authorizationUrl %>';
const REVOCATION_URL = '<%= connector.revokeUrl %>';
const SERVICE_NAME = '<%= h.capitalize(name) %>';

class ServiceConnector extends OAuthConnector {
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
      ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your <%= h.capitalize(name) %> App';
      ctx.body.schema.properties.clientId.description = 'The Client ID from your <%= h.capitalize(name) %> App';
      ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your <%= h.capitalize(name) %> App';
    });
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
