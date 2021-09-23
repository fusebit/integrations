import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';
const schema = require('./schema.json');
const uischema = require('./uischema.json');

const connector = new Connector();
const router = connector.router;
const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';

// TODO: should move these into the connector as params.  This is gonna be a repeated endpoint
// `tokenUrl` and `authorizationUrl` can exist on the connector.  We already have a `startup` event handler there
// `schema` and `uischema` can exist on the connector, with exposed setters.  The route is consistent, the schema is not
router.on('/lifecycle/startup', async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
  const { config: cfg } = ctx.state.manager;
  cfg.configuration.tokenUrl = cfg.configuration.tokenUrl || TOKEN_URL;
  cfg.configuration.authorizationUrl = cfg.configuration.authorizationUrl || AUTHORIZATION_URL;
  return next();
});

router.get(
  '/api/configure',
  connector.middleware.authorizeUser('connector:put'),
  async (ctx: Connector.Types.Context) => {
    ctx.body = {
      data: {
        ...ctx.state.manager.config.configuration,
      },
      schema,
      uischema,
    };
  }
);

router.use(OAuthConnector.router.routes());

export default connector;
