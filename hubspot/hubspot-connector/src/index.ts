import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';
import { schema, uischema } from './configure';

const connector = new Connector();
const router = connector.router;
const TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const AUTHORIZATION_URL = 'https://app.hubspot.com/oauth/authorize';

router.on('startup', async ({ mgr, cfg }: Connector.Types.IOnStartup, next: Connector.Types.Next) => {
  cfg.configuration.tokenUrl = cfg.configuration.tokenUrl || TOKEN_URL;
  cfg.configuration.authorizationUrl = cfg.configuration.authorizationUrl || AUTHORIZATION_URL;
  return next();
});

router.get(
  '/api/configure',
  connector.middleware.authorizeUser('connector:put'),
  async (ctx: Connector.Types.Context) => {
    ctx.body = {
      data: ctx.state.manager.config.configuration,
      schema,
      uischema,
    };
  }
);

router.use(OAuthConnector.router.routes());

export default connector;
