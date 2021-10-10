---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/src/index.ts
---
import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';

const TOKEN_URL = '<%= connector.tokenUrl %>';
const AUTHORIZATION_URL = '<%= connector.authorizationUrl %>';

const connector = new Connector();
const router = connector.router;

// OAuth Configuration Updates and /api/configure handling
router.use(OAuthConnector.middleware.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, '<%= name.toLowerCase() %>'));
OAuthConnector.onConfigure(router, async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
  await next();

  // Adjust the ui schema and layout
  ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
    '<%= h.capitalize(name) %> Configuration';
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
