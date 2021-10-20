import { test, expect } from '@playwright/test';

import {
  IAccount,
  getAccount,
  createSession,
  commitSession,
  updateIntegrationConnector,
  fusebitRequest,
  RequestMethod,
} from './sdk';
import { startHttpServer, waitForExpress } from './server';

let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

// const DEVELOPER_CONSOLE_LINK =
//   'https://developer.atlassian.com/console/myapps/d639ce0f-f387-45d1-8421-e6d3dc6288c7/authorization/auth-code-grant';

const OAUTH_USERNAME = 'benn+atlassian1@fusebit.io';
const OAUTH_PASSWORD = 'W*.Kor.UN4M4CjKvN.sJ7DjrD';
const TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const AUTHORIZATION_URL = 'https://auth.atlassian.com/authorize';
const SECRET_CLIENTID = 'QylxmNLwv8rwLHAFoPqCiY6oO2TWPbJT';
const SECRET_CLIENTSECRET = 'cVBtaOXclf2-H4CZTyqfzwriBpBwlTXOAi1YJdsZl0yJw9uN0-hzztuIUQr988Ci';
const OAUTH_AUDIENCE = 'api.atlassian.com';

/*
const INTEGRATION_ID = 'test-oauth-6369-int';
const CONNECTOR_ID = 'test-oauth-6369-con';
*/
const INTEGRATION_ID = 'atlassian-test-integration';
const CONNECTOR_ID = 'atlassian-test-connector';

const integrationId = INTEGRATION_ID;
const connectorId = CONNECTOR_ID;

const PACKAGE_CONNECTOR = '@fusebit-int/atlassian-connector';
const PACKAGE_PROVIDER = '@fusebit-int/atlassian-provider';

const OAUTH_SCOPES = [
  'read:jira-user',
  'read:jira-work',
  'read:me',
  'read:confluence-content.summary',
  'offline_access' /* XXX should move to connector */,
].join(' ');

const makeIntegration = (id: string, conId: string) => ({
  id,
  data: {
    componentTags: {},
    configuration: {},

    handler: './integration',
    components: [{ name: conId, entityType: 'connector', entityId: conId, dependsOn: [], provider: PACKAGE_PROVIDER }],
    files: {
      'integration.js': [
        "const { Integration } = require('@fusebit-int/framework');",
        '',
        'const integration = new Integration();',
        'const router = integration.router;',
        '',
        "router.get('/api/do/:installationId', async (ctx) => {",
        `  const sdk = await integration.service.getSdk(ctx, '${conId}', ctx.params.installationId);`,
        '  ctx.body = await sdk.getAccessibleResources();',
        '});',
        "router.get('/api/token/', async (ctx) => { ctx.body = ctx.state.params.functionAccessToken; });",
        'module.exports = integration;',
      ].join('\n'),
    },
  },
});

const makeConnector = (id: string) => ({
  id,
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

test('basic test', async ({ page }) => {
  const server = await startHttpServer(0);
  const localUrl = `http://localhost:${server.port}`;

  const called = waitForExpress();
  server.app.use(called);

  // Update the integration to use the current code and configuration
  await updateIntegrationConnector(account, makeIntegration(integrationId, connectorId), makeConnector(connectorId));

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

  // Open questions:
  //  * Atlassian only supports a single url; establish a known endpoint and use it, in series, with all of
  //  the tests (no parallel since can't update test code) OR once the identity is established, then iterate
  //  over a bunch of tests in parallel, that's fine too.
  //    * Create the integration and then open up the developer console link and make sure the page has the
  //    right url in it?
  //  * Make a note somewhere that the big fix was supplying the audience parameter, without that none of it
  //  worked.
  //  * How do we use the latest code in the repo instead of only what was published historically?
  //  * Also also, how do we store secrets for these tests in a way that makes sense?
}, 180000);
