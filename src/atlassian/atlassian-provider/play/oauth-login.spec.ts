import * as fs from 'fs';

import { test, expect } from '@playwright/test';

import {
  IAccount,
  getAccount,
  createSession,
  commitSession,
  waitForOperation,
  fusebitRequest,
  RequestMethod,
  postAndWait,
} from './sdk';
import { startHttpServer, waitForExpress } from './server';

let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

// const DEVELOPER_CONSOLE_LINK =
//   'https://developer.atlassian.com/console/myapps/d639ce0f-f387-45d1-8421-e6d3dc6288c7/authorization/auth-code-grant';

// Load the secrets from the environment
const { OAUTH_USERNAME, OAUTH_PASSWORD, SECRET_CLIENTID, SECRET_CLIENTSECRET } = process.env;

// A variety of constants used in this test
const TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const AUTHORIZATION_URL = 'https://auth.atlassian.com/authorize';
const OAUTH_AUDIENCE = 'api.atlassian.com'; // Required otherwise Atlassian OAuth just sorta fails during login
const PACKAGE_CONNECTOR = '@fusebit-int/atlassian-connector';
const PACKAGE_PROVIDER = '@fusebit-int/atlassian-provider';
const INTEGRATION_ID = 'atlassian-test-integration';
const CONNECTOR_ID = 'atlassian-test-connector';

const integrationId = INTEGRATION_ID;
const connectorId = CONNECTOR_ID;

const OAUTH_SCOPES = [
  'read:jira-user',
  'read:jira-work',
  'manage:jira-webhook',
  'read:me',
  'read:confluence-content.summary',
  'offline_access',
].join(' ');

const makeIntegration = () => ({
  id: integrationId,
  data: {
    componentTags: {},
    configuration: {},

    handler: './integration',
    components: [
      { name: connectorId, entityType: 'connector', entityId: connectorId, dependsOn: [], provider: PACKAGE_PROVIDER },
    ],
    files: {
      'integration.js': fs.readFileSync('./play/mock/oauth-login.js', 'utf8'),
    },
  },
});

const makeConnector = () => ({
  id: connectorId,
  data: {
    handler: PACKAGE_CONNECTOR,
    configuration: {
      scope: OAUTH_SCOPES,
      authorizationUrl: AUTHORIZATION_URL,
      tokenUrl: TOKEN_URL,
      clientId: SECRET_CLIENTID,
      clientSecret: SECRET_CLIENTSECRET,
      audience: OAUTH_AUDIENCE,
      extraParams: 'prompt=consent',
    },
  },
});

const ensureEntities = async () => {
  const tasks = [];

  const recreateIntegration = async () => {
    let result = await fusebitRequest(account, RequestMethod.delete, `/integration/${integrationId}`);
    result = await waitForOperation(account, `/integration/${integrationId}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(account, `/integration/${integrationId}`, makeIntegration());
    expect(result).toBeHttp({ statusCode: 200 });
  };

  const recreateConnector = async () => {
    await fusebitRequest(account, RequestMethod.delete, `/connector/${connectorId}`);
    let result = await waitForOperation(account, `/connector/${connectorId}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(account, `/connector/${connectorId}`, makeConnector());
    expect(result).toBeHttp({ statusCode: 200 });
  };

  // await Promise.all([recreateIntegration(), recreateConnector()]);
};

test.beforeAll(async () => {
  console.log(`Before all...`);
  await ensureEntities();
  console.log(`after all...`);
});

test('basic test', async ({ page }) => {
  const server = await startHttpServer(0);
  const localUrl = `http://localhost:${server.port}`;

  const called = waitForExpress();
  server.app.use(called);

  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, integrationId, `${localUrl}/oauthTest`);

  // Open the browser to the session url
  await page.goto(targetUrl);

  // Perform the login
  await page.waitForSelector('text=Log in to your account');
  await page.fill('#username', OAUTH_USERNAME);
  await page.click('button:has-text("Continue")');
  await page.fill('[placeholder="Enter password"]', OAUTH_PASSWORD);
  await page.click('button:has-text("Log in")');

  // Accept the permissions page
  await page.click('button:has-text("Accept")');

  // Wait for the auth target to be satisfied, and send the browser back to the local server.
  const request = await called.waitForCall();

  // Get the session id from the request
  const sessionId = request.query.session;

  // Commit the session id
  let response = await commitSession(account, integrationId, sessionId);

  const installationId = response.body.id;

  // Dispatch to the integration to do the thing.
  response = await fusebitRequest(account, RequestMethod.get, `/integration/${integrationId}/api/do/${installationId}`);

  expect(response).toBeHttp({ statusCode: 200 });

  expect(response.body.length).toBeGreaterThan(0);
  expect(response.body[0]).toHaveProperty('id');

  console.log(`Installation id: ${installationId}`);
  console.log(JSON.stringify(response.body, null, 2));

  // Open questions:
  //  * How do we use the latest code in the repo instead of only what was published historically?
  //    * Duh - serve it in a temporary directory.  Don't even need to do the push in that case, just need to
  //      make sure the connector and integration have been created.
  //
  //  * https://developer.atlassian.com/cloud/jira/platform/webhooks/
  //  * https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-webhooks/
  //    * This is the worst of both worlds: a dynamic registration that needs to occur on each customer,
  //      authenticated using a jwt signed with the app secret.
  //    * Easy option: add an endpoint to the connector that returns a 200 if the secret is valid.
  //  * Also, the webhooks expire every 30 days... so maybe register them and start returning a warning health
  //    value when they get close to expiring?
  //  * Plausible API extensions returned from the provider:
  //
  //  * Note: a lot of these apparently require read:jira-work, manage:jira-webhook - add them to the required
  //    list in the connector?
  /*

*/
}, 180000);
