import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
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
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);
  await page.goto(targetUrl);
  // Click text=US Login
  await page.click('text=US Login');
  await expect(page).toHaveURL('https://app.pagerduty.com/global/authn/authentication/US-Login');
  // Click input[name="userName"]
  await page.click('input[name="userName"]');
  // Fill input[name="userName"]
  await page.fill('input[name="userName"]', Constants.OAUTH_USERNAME);
  // Click input[name="password"]
  await page.click('input[name="password"]');
  // Fill input[name="password"]
  await page.fill('input[name="password"]', Constants.OAUTH_PASSWORD);
  // Click text=Login
  await Promise.all([page.waitForNavigation(), page.click('text=Login')]);
  // Click text=Submit Consent
  await Promise.all([page.waitForNavigation(), page.click('text=Submit Consent')]);
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
  expect(response).toBeHttp({ body: { success: true } });
  /* Now that the environment is set up, let's do a handful of tests in parallel. */
  await Promise.all([testWebhook({ installId })]);
});

const testWebhook = async ({ installId }) => {
  await clearStorage();

  await registerWebhook(installId);

  await pushChange(installId);

  await waitForWebhook();
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
    `/integration/${Constants.INTEGRATION_ID}/api/webhook/${installId}`
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
