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
  generateTotpToken,
} from '@fusebit-int/play';

let account: IAccount;

const OAUTH_SCOPES = ['crm.objects.contacts.read', 'crm.objects.contacts.write'].join(' ');

const { MFA_SECRET, HUBSPOT_TEST_USER_ACCOUNT } = process.env;

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
      oauthScopes: OAUTH_SCOPES,
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
      {
        name: '##CONTACT_EMAIL##',
        value: Constants.OAUTH_USERNAME,
      },
    ]
  );
});

test.beforeEach(async ({ page }) => {
  //await revokeAuthorization(page);
});

test('Authorize and fetch integration endpoints', async ({ page }) => {
  const { app, url: localUrl } = await startHttpServer();
  const called = waitForExpress();
  app.use(called);
  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);
  // Open the browser to the session url
  await page.goto(targetUrl);
  // Click input[type="email"]
  await page.click('input[type="email"]');
  // Click input[type="email"]
  await page.click('input[type="email"]');
  // Fill input[type="email"]
  await page.fill('input[type="email"]', Constants.OAUTH_USERNAME);
  // Click input[type="password"]
  await page.click('input[type="password"]');
  // Fill input[type="password"]
  await page.fill('input[type="password"]', Constants.OAUTH_PASSWORD);
  // Click [data-test-id="password-login-button"]
  await Promise.all([page.waitForNavigation(), page.click('[data-test-id="password-login-button"]')]);

  // Ensure you have MFA enabled in order to bypass code verification email
  const authenticatorToken = generateTotpToken(MFA_SECRET);
  // Fill input[type="text"]
  await page.fill('input[type="text"]', authenticatorToken);
  // Click button:has-text("Log in")
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Log in")')]);

  await page.click(`text=${HUBSPOT_TEST_USER_ACCOUNT} >> div`);

  // Click button:has-text("Choose Account")
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Choose Account")')]);

  // // Wait for the auth target to be satisfied, and send the browser back to the local server.
  const request = await called.waitForCall();

  // // Get the session id from the request
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
  expect(response.body).toHaveProperty('count');

  await updateContact(installId);
  await waitForWebhook();
});

async function getOrCreateContact(installId: string): Promise<any> {
  const hubspotContact = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/contact/check/${installId}`
  );
  return hubspotContact?.body;
}

async function updateContact(installId: string): Promise<void> {
  const contact = await getOrCreateContact(installId);
  expect(contact).toHaveProperty('id');
  expect(contact).toHaveProperty('properties');

  const updatedWebsite = `https://${(Math.random() + 1).toString(36).substring(2)}.fusebit.io`;
  const updatedContactResponse = await fusebitRequest(
    account,
    RequestMethod.put,
    `/integration/${Constants.INTEGRATION_ID}/api/contact/${installId}/${contact.id}`,
    { website: updatedWebsite }
  );
  const responseBody = updatedContactResponse.body;
  expect(updatedContactResponse).toBeHttp({ statusCode: 200 });
  expect(responseBody.body.properties.website).toEqual(updatedWebsite);
}

const waitForWebhook = async () => {
  // Wait for the webhook event to fire.
  let cnt: number;
  for (cnt = 10; cnt > 0; cnt--) {
    // Get the contents of the webhook storage and validate if it's what the test is looking for.
    const response = await fusebitRequest(
      account,
      RequestMethod.get,
      `/storage/integration/${Constants.INTEGRATION_ID}/test/${Constants.CONNECTOR_ID}/webhook/*`,
      {},
      { version: 1 }
    );
    expect(response).toBeHttp({ statusCode: 200 });

    if (response.body.total > 0) {
      const entries = await Promise.all(
        response.body.items.map((item: { storageId: string }) =>
          fusebitRequest(account, RequestMethod.get, `/storage/${item.storageId}`, {}, { version: 1 })
        )
      );
      const filter = (entry) =>
        entry.body.data.data.propertyName === 'website' &&
        entry.body.data.data.subscriptionType === 'contact.propertyChange';
      // Check to see if any of the entries match
      if (entries.some(filter)) {
        // Good enough for now - mark the test a success and move on.
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    cnt -= 1;
  }
  expect(cnt).toBeGreaterThan(0);
};
