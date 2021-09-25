import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';
import crypto from 'crypto';
import superagent from 'superagent';

const TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const AUTHORIZATION_URL = 'https://app.hubspot.com/oauth/authorize';

const connector = new Connector();
const router = connector.router;

// OAuth Configuration Updates and /api/configure handling
router.use(OAuthConnector.middleware.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, 'hubspot'));
OAuthConnector.onConfigure(router, async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
  await next();

  // Adjust the configuration elements here
  ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
    'HubSpot Configuration';

  // Adjust the data schema
  ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your HubSpot App';
  ctx.body.schema.properties.clientId.description = 'The Client ID from your HubSpot App';
  ctx.body.schema.properties.clientSecret.description = 'The Client Secret from your HubSpot App';
});

connector.service.setGetEventsFromPayload((ctx) => {
  return ctx.req.body || [];
});

connector.service.setGetAuthIdFromEvent((event) => {
  return `${event.appId}/${event.portalId}`;
});

// HubSpot has a very straightforward auth scheme; there's a slightly more complicated v2 variant, but it's
// not in use at this time for webhooks.
connector.service.setValidateWebhookEvent((ctx: Connector.Types.Context) => {
  if (ctx.req.headers['x-hubspot-signature-version'] !== 'v1') {
    ctx.throw(400, { message: `Unsupported signature version: ${ctx.req.headers['x-hubspot-signature-version']}` });
  }

  const signatureHeader = ctx.req.headers['x-hubspot-signature'] as string;
  const clientSecret = ctx.state.manager.config.configuration.clientSecret;
  const requestBody = JSON.stringify(ctx.req.body);

  const calculatedHash = crypto.createHash('sha256').update(`${clientSecret}${requestBody}`).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signatureHeader, 'utf8'), Buffer.from(calculatedHash, 'utf8'));
});

// HubSpot doesn't have any challenge messages
connector.service.setInitializationChallenge(() => false);

// Query hubspot to get the hub_id (aka portalId) for this authenticated user.
OAuthConnector.service.setGetTokenAuthId(async (ctx: Connector.Types.Context, token: any) => {
  try {
    const meUrl = new URL(ctx.state.manager.config.configuration.tokenUrl);
    const response = await superagent.get(`${meUrl.origin}/oauth/v1/access-tokens/${token.access_token}`);
    return `${response.body.app_id}/${response.body.hub_id}`;
  } catch (error) {
    // The tokenUrl is probably set to the proxy mode; just return, as webhooks aren't supported there
    // anyways.
    return;
  }
});

connector.service.setGetWebhookEventType((event: any) => 'events');

router.use(OAuthConnector.router.routes());

export default connector;
