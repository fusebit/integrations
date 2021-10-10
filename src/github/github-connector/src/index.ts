import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';

const connector = new Connector();
const router = connector.router;

// OAuth Configuration Updates and /api/configure handling
router.use(OAuthConnector.middleware.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, 'github'));
OAuthConnector.onConfigure(router, async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
  await next();

  // Adjust the ui schema and layout
  ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
    'GitHub Configuration';
});

// TODO: Modify the following to support WebHook events

/*
connector.service.setGetEventsFromPayload((ctx) => { });
connector.service.setGetAuthIdFromEvent((event) => { });
connector.service.setValidateWebhookEvent((ctx: Connector.Types.Context) => { });
connector.service.setInitializationChallenge((ctx: Connector.Types.Context) => { });
connector.service.setGetTokenAuthId(async (ctx: Connector.Types.Context, token: any) => { });
connector.service.setGetWebhookEventType((event: any) => event.type);
*/

router.use(OAuthConnector.router.routes());

export default connector;
