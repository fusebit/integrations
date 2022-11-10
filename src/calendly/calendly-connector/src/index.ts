import { PrivateKeyConnector } from '@fusebit-int/privatekey-connector';
import { Service } from './Service';

class ServiceConnector extends PrivateKeyConnector<Service> {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  protected getServiceName(): string {
    return 'Calendly';
  }

  protected getKeyName(): string {
    return 'Personal access token';
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
