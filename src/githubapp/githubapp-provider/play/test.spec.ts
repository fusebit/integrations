import { test, expect } from '@playwright/test';

import * as Constants from './setup';

import { IAccount, getAccount, createSession, commitSession, fusebitRequest, RequestMethod } from './sdk';
import { startHttpServer, waitForExpress } from './server';
import { revokeAuthorization } from './appConfig';

let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test.beforeAll(async () => {
  await Constants.ensureEntities(account);
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
  const sessionId = request.query.session;

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
  expect(response.body).toHaveProperty('login');
  expect(response.body).toHaveProperty('avatar_url');

  await listIssues(installId);
  await createIssue(installId);
  await waitForWebhook();
}, 180000);

async function listIssues(installId: string): Promise<void> {
  const githubIssuesResponse = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/issues/${installId}`
  );
  expect(githubIssuesResponse.body.length).toBeGreaterThan(0);
  expect(githubIssuesResponse.body[0]).toHaveProperty('url');
  expect(githubIssuesResponse.body[0]).toHaveProperty('id');
  expect(githubIssuesResponse.body[0]).toHaveProperty('title');
}

async function createIssue(installId: string): Promise<void> {
  const githubIssuesResponse = await fusebitRequest(
    account,
    RequestMethod.post,
    `/integration/${Constants.INTEGRATION_ID}/api/issues/${installId}`
  );
  expect(githubIssuesResponse.body).toHaveProperty('url');
  expect(githubIssuesResponse.body).toHaveProperty('id');
  expect(githubIssuesResponse.body).toHaveProperty('repository_url');
  expect(githubIssuesResponse.body).toHaveProperty('number');
  expect(githubIssuesResponse.body).toHaveProperty('title');
}

const waitForWebhook = async () => {
  // Wait for the webhook event to fire.
  let cnt: number;
  for (cnt = 10; cnt > 0; cnt--) {
    // Get the contents of the webhook storage and validate if it's what the test is looking for.
    const response = await fusebitRequest(
      account,
      RequestMethod.get,
      `/storage/integration/${Constants.INTEGRATION_ID}/test/githubapp/webhook/*`,
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
      // Check to see if any of the entries match
      if (entries.some((entry: { body: any }) => entry.body.data.eventType === 'issues.opened')) {
        // Good enough for now - mark the test a success and move on.
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    cnt -= 1;
  }
  expect(cnt).toBeGreaterThan(0);
};
