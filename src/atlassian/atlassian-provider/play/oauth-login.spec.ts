import { test, expect } from '@playwright/test';

import * as Constants from './setup';

import { IAccount, getAccount, createSession, commitSession, fusebitRequest, RequestMethod } from './sdk';
import { startHttpServer, waitForExpress } from './server';

let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test.beforeAll(async () => {
  console.log('Setting up entties...');
  await Constants.ensureEntities(account);
  console.log('... complete.');
});

test('basic test', async ({ page }) => {
  const { app, url: localUrl } = await startHttpServer();

  const called = waitForExpress();
  app.use(called);

  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);

  // Open the browser to the session url
  await page.goto(targetUrl);

  // Perform the login
  await page.waitForSelector('text=Log in to your account');
  await page.fill('#username', Constants.OAUTH_USERNAME);
  await page.click('button:has-text("Continue")');
  await page.fill('[placeholder="Enter password"]', Constants.OAUTH_PASSWORD);
  await page.click('button:has-text("Log in")');

  // Accept the permissions page
  await page.click('button:has-text("Accept")');

  // Wait for the auth target to be satisfied, and send the browser back to the local server.
  const request = await called.waitForCall();

  // Get the session id from the request
  const sessionId = request.query.session;

  // Commit the session id
  let response = await commitSession(account, Constants.INTEGRATION_ID, sessionId);

  const installId = response.body.id;

  // Dispatch to the integration to do the thing.
  response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/check/${installId}`
  );

  expect(response).toBeHttp({ statusCode: 200 });

  expect(response.body.length).toBeGreaterThan(0);
  expect(response.body[0]).toHaveProperty('id');

  console.log(`Installation id: ${installId}`);

  /* Now that the environment is set up, let's do a handful of tests in parallel. */
  await Promise.all([testWebhook({ installId })]);
}, 180000);

const testWebhook = async ({ installId }) => {
  await unregisterWebhooks(installId);

  await clearStorage();

  await registerWebhook(installId);

  await pushChange(installId);

  await waitForWebhook();
};

const unregisterWebhooks = async (installId: string) => {
  // Clean up old webhooks and storage
  const response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/unregister/${installId}`
  );
  expect(response).toBeHttp({ statusCode: 200 });
};

const clearStorage = async () => {
  let response = await fusebitRequest(
    account,
    RequestMethod.delete,
    `/storage/integration/${Constants.INTEGRATION_ID}/test/atlassianProvider/webhook/?recursive=true`,
    {},
    { version: 1 }
  );
  expect(response).toBeHttp({ statusCode: [200, 404] });

  response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/storage/integration/${Constants.INTEGRATION_ID}/test/atlassianProvider/webhook/*`,
    {},
    { version: 1 }
  );
  expect(response).toBeHttp({ statusCode: 200, data: { total: 0 } });
};

const registerWebhook = async (installId: string) => {
  // Register the webhook.
  const response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/register/${installId}`
  );
  expect(response).toBeHttp({ statusCode: 200 });
};

const pushChange = async (installId: string) => {
  // Change the data in the system
  const response = await fusebitRequest(
    account,
    RequestMethod.get,
    `/integration/${Constants.INTEGRATION_ID}/api/event/${installId}`
  );
  expect(response).toBeHttp({ statusCode: 204 });
};

const waitForWebhook = async () => {
  // Wait for the webhook event to fire.
  let cnt: number;
  for (cnt = 10; cnt > 0; cnt--) {
    // Get the contents of the webhook storage and validate if it's what the test is looking for.
    const response = await fusebitRequest(
      account,
      RequestMethod.get,
      `/storage/integration/${Constants.INTEGRATION_ID}/test/atlassianProvider/webhook/*`,
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
      if (entries.some((entry: { body: any }) => entry.body.data.eventType === 'jira:issue_updated')) {
        // Good enough for now - mark the test a success and move on.
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    cnt -= 1;
  }
  expect(cnt).toBeGreaterThan(0);
};
