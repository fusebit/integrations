import { PrivateKeyConnector } from '@fusebit-int/privatekey-connector';
import { Service } from './Service';

class ServiceConnector extends PrivateKeyConnector<Service> {
  protected getServiceName(): string {
    return 'Clearbit';
  }
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
