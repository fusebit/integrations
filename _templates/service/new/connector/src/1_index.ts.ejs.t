---
to: "<%= `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` %>"
---

<% if (connector.tokenUrl) { -%>
import { Connector } from '@fusebit-int/framework';
import { OAuthConnector } from '@fusebit-int/oauth-connector';
import { Service } from './Service';

const TOKEN_URL = '<%= connector.tokenUrl%>';
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
<% } else { -%>
import { PrivateKeyConnector } from '@fusebit-int/privatekey-connector';
import { Service } from './Service';

class ServiceConnector extends PrivateKeyConnector<Service> {
  static Service = Service;

  protected createService() {
  return new ServiceConnector.Service();
  }

  protected getServiceName(): string {
  return '<%= name %>';
  }

  protected getKeyName(): string {
  return '<%= privateKeyFieldName %>';
  }
<% } -%>

<% if (connector.tokenUrl || includeWebhooks) { -%>
  public constructor() {
    super();
    // Configure
    // Webhook management
  }
}
<% } -%>

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
