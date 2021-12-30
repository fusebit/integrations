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
} from '@fusebit-int/play';

import { revokeAuthorization } from './appConfig';

// Provider specific variables
const { REPOSITORY_OWNER, REPOSITORY } = process.env;

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
      oauthScopes: '',
      authorizationUrl: Constants.AUTHORIZATION_URL,
      tokenUrl: Constants.TOKEN_URL,
      clientId: Constants.SECRET_CLIENTID,
      clientSecret: Constants.SECRET_CLIENTSECRET,
      signingSecret: Constants.SIGNING_SECRET,
    },
    [
      {
        name: '##OWNER##',
        value: REPOSITORY_OWNER,
      },
      {
        name: '##REPOSITORY##',
        value: REPOSITORY,
      },
      {
        name: '##STORAGE_KEY##',
        value: (Math.random() * 10000000).toString(),
      },
    ]
  );
});

test.beforeEach(async ({ page }) => {
  await revokeAuthorization(page);
});

test('Authorize and fetch integration endpoints', async ({ page }) => {
  const { app, url: localUrl } = await startHttpServer();

  const called = waitForExpress();
  app.use(called);
  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);
  // Open the browser to the session url
  await page.goto(targetUrl);

  // Perform the login
  await page.click('input[name="login"]');
  await page.fill('input[name="login"]', Constants.OAUTH_USERNAME);
  await page.fill('input[name="password"]', Constants.OAUTH_PASSWORD);
  await page.click('input:has-text("Sign in")');

  // Accept the permissions page
  await page.click('button:has-text("Authorize Fusebit Test-App")');

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
  expect(response.body).toHaveProperty('id');

  await checkIssue(installId);
  await waitForWebhook();
});

async function listIssues(installId: string): Promise<any> {
  const githubIssuesResponse = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/issues/${installId}`
  );
  return githubIssuesResponse?.body;
}

async function checkIssue(installId: string): Promise<void> {
  const issues = await listIssues(installId);
  let issue = issues[0];

  if (!issues.length) {
    const githubIssuesResponse = await fusebitRequest(
      account,
      RequestMethod.post,
      `/integration/${Constants.INTEGRATION_ID}/api/issues/${installId}`
    );
    issue = githubIssuesResponse.body;
    expect(issue).toHaveProperty('id');
  }

  const updatedTittle = `Fusebit issue ${Math.random() * 10000000}`;
  const updateIssueResponse = await fusebitRequest(
    account,
    RequestMethod.put,
    `/integration/${Constants.INTEGRATION_ID}/api/issues/${installId}/${issue.number}`,
    { title: updatedTittle }
  );
  expect(updateIssueResponse.body.title).toBe(updatedTittle);
}

const waitForWebhook = async () => {
  // Wait for the webhook event to fire.
  let storageFound = false;
  let retriesCounter = 0;
  const retries = 10; // Try 10 times to ensure the webhook is called.

  while (!storageFound && retriesCounter < retries) {
    retriesCounter += 1;
    const integrationStorageResponse = await fusebitRequest(
      account,
      RequestMethod.get,
      `/integration/${Constants.INTEGRATION_ID}/api/storage`
    );
    if (integrationStorageResponse.statusCode === 200 && integrationStorageResponse.body.data) {
      if (integrationStorageResponse.body.data.eventType === 'issues.edited') {
        storageFound = true;
        break;
      }
    }
    // Add some delay to give more time to the webhook call.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  expect(storageFound).toBeTruthy();
};
