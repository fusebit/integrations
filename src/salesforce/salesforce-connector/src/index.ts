import { Connector } from '@fusebit-int/framework';
import OAuthConnector from '@fusebit-int/oauth-connector';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const AUTHORIZATION_URL = 'https://login.salesforce.com/services/oauth2/authorize';

const connector = new Connector();
const router = connector.router;

// OAuth Configuration Updates and /api/configure handling
router.use(OAuthConnector.middleware.adjustUrlConfiguration(TOKEN_URL, AUTHORIZATION_URL, 'salesforce'));
OAuthConnector.onConfigure(router, async (ctx: Connector.Types.Context, next: Connector.Types.Next) => {
  await next();

  // Adjust the configuration elements here
  ctx.body.uischema.elements.find((element: { label: string }) => element.label == 'OAuth2 Configuration').label =
    'Salesforce Configuration';

  // Adjust the data schema
  ctx.body.schema.properties.scope.description = 'Space separated scopes to request from your Salesforce Connected App';
  ctx.body.schema.properties.clientId.description = 'The OAuth Consumer Key from your Salesforce Connected App';
  ctx.body.schema.properties.clientSecret.description = 'The Consumer Secret from your Salesforce Connected App';
});

router.use(OAuthConnector.router.routes());

export default connector;
