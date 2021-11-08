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

    this.router.use(
      (ctx: Connector.Types.Context, next: Connector.Types.Next): ReturnType<Connector.Types.Next> => {
        const { config: cfg } = ctx.state.manager;
        cfg.configuration.constants = {
          urls: {
            production: {
              tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            },
            webhookUrl: `${ctx.state.params.baseUrl}/api/fusebit_webhook_event`,
          },
        };
        return next();
      }
    );

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
