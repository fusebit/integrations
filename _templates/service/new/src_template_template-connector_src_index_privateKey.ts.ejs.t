---
to: "<%= !connector.tokenUrl ? `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/src/index.ts` : null %>"
---
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
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };