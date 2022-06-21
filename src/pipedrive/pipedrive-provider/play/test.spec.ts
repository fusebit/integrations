import { test, expect } from '@playwright/test';
import {
  Constants,
  startHttpServer,
  waitForExpress,
  IAccount,
  getAccount,
  createSession,
  commitSession,
  fusebitRequest,
  RequestMethod,
  waitForWebhook,
} from '@fusebit-int/play';
import { authenticate } from './actions';

let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test.beforeAll(async () => {
  await Constants.ensureEntities(
    account,
    {
      integrationId: Constants.INTEGRATION_ID,
      connectorId: Constants.CONNECTOR_ID,
      packageProvider: Constants.PACKAGE_PROVIDER,
      packageConnector: Constants.PACKAGE_CONNECTOR,
      oauthScopes: Constants.OAUTH_SCOPES,
      authorizationUrl: Constants.AUTHORIZATION_URL,
      tokenUrl: Constants.TOKEN_URL,
      clientId: Constants.SECRET_CLIENTID,
      clientSecret: Constants.SECRET_CLIENTSECRET,
      signingSecret: Constants.SIGNING_SECRET,
    },
    [
      {
        name: '##CONNECTOR_NAME##',
        value: Constants.CONNECTOR_ID,
      },
    ]
  );
});

test.beforeEach(async ({ page }) => {
  // Execute test prerequisites here
});

test('pipedrive-provider test', async ({ page }) => {
  const { app, url: localUrl } = await startHttpServer();

  const called = waitForExpress();
  app.use(called);
  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);
  // Open the browser to the session url
  await page.goto(targetUrl);

  await authenticate(page);

  // Wait for the auth target to be satisfied, and send the browser back to the local server.
  const request = await called.waitForCall();

  // Get the session id from the request
  const sessionId = request.query.session as string;

  // Commit the session id
  let response = await commitSession(account, Constants.INTEGRATION_ID, sessionId);

  const installId = response.body.id;

  response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/check/${installId}`
  );

  expect(response).toBeHttp({ statusCode: 200 });

  // TODO: Perform additional checks here: Use connector SDK, Webhooks, etc.
  const filter = (entry) => entry.body.data.eventType === 'event_callback'; // update the event type here
  await waitForWebhook(account, filter);
});
