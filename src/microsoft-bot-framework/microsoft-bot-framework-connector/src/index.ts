import { Connector } from '@fusebit-int/framework';
import schema from './config/schema.json';
import uischema from './config/uischema.json';

import { Service } from './Service';

class ServiceConnector extends Connector {
  static Service = Service;

  protected createService() {
    return new ServiceConnector.Service();
  }

  public constructor() {
    super();

    this.router.get(
      '/api/configure',
      this.middleware.authorizeUser('connector:put'),
      async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
        ctx.body = JSON.parse(
          JSON.stringify({
            data: {
              ...ctx.state.manager.config.configuration,
            },
            schema,
            uischema,
          })
        );
        return next();
      }
    );
  }
}

const connector = new ServiceConnector();

export default connector;
export { ServiceConnector };
