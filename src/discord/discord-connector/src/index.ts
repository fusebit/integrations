import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';
import { schema, uischema } from './configure';

const connector = new Connector();
const router = connector.router;
const TOKEN_URL = 'https://api.linear.app/oauth/token';
const AUTHORIZATION_URL = 'https://linear.app/oauth/authorize';

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
        redirectUrl: `${ctx.state.params.baseUrl}/api/callback`,
        webhookUrl: `${ctx.state.params.baseUrl}/api/fusebit_webhook_event`,
      },
      schema,
      uischema,
    };
  }
);

/*
connector.service.setGetEventsFromPayload((ctx) => {
  return ctx.req.body || [];
});

connector.service.setGetAuthIdFromEvent((event) => {
  return `${event.appId}/${event.portalId}`;
});

connector.service.setValidateWebhookEvent((ctx: Connector.Types.Context) => {
});

connector.service.setInitializationChallenge(() => false);

OAuthConnector.service.setGetTokenAuthId(async (ctx: Connector.Types.Context, token: any) => {
});

connector.service.setGetWebhookEventType((event: any) => 'events');
*/

router.use(OAuthConnector.router.routes());

export default connector;
