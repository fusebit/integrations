import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';
import { schema, uischema } from './configure';
import crypto from 'crypto';

const connector = new Connector();
const router = connector.router;
const TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const AUTHORIZATION_URL = 'https://slack.com/oauth/v2/authorize';

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
        webhookUrl: `${ctx.state.params.baseUrl}/api/fusebit_webhook_event`,
      },
      schema,
      uischema,
    };
  }
);

connector.service.setGetEventsFromPayload((ctx) => {
  return [ctx.req.body];
});

connector.service.setGetAuthIdFromEvent((event) => {
  return event.authorizations?.[0]?.user_id;
});

connector.service.setValidateWebhookEvent((ctx: Connector.Types.Context) => {
  const signingSecret = ctx.state.manager.config.configuration.signingSecret;
  const timestampHeader = ctx.req.headers['x-slack-request-timestamp'];
  const requestBody = ctx.req.body;
  const rawBody = JSON.stringify(requestBody)
    .replace(/\//g, '\\/')
    .replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

  const basestring = ['v0', timestampHeader, rawBody].join(':');
  const calculatedSignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(basestring).digest('hex');

  const requestSignature = ctx.req.headers['x-slack-signature'] as string;

  const calculatedSignatureBuffer = Buffer.from(calculatedSignature, 'utf8');
  const requestSignatureBuffer = Buffer.from(requestSignature, 'utf8');
  return crypto.timingSafeEqual(calculatedSignatureBuffer, requestSignatureBuffer);
});

connector.service.setInitializationChallenge((ctx: Connector.Types.Context) => {
  if (ctx.req.body.challenge) {
    ctx.body = { challenge: ctx.req.body.challenge };
    return true;
  }
  return false;
});

OAuthConnector.service.setGetTokenAuthId(async (ctx: Connector.Types.Context, token: any) => {
  return token.bot_user_id;
});

connector.service.setGetWebhookEventType((event: any) => event.type);

router.use(OAuthConnector.router.routes());

export default connector;
