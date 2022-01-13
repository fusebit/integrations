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

const OAUTH_SCOPES = ['crm.objects.contacts.read', 'crm.objects.contacts.write'].join(' ');

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

test('Authorize and fetch integration endpoints', async ({ page }) => {
  const { app, url: localUrl } = await startHttpServer();
  const called = waitForExpress();
  app.use(called);
  // Create a new session to drive the browser through
  const targetUrl = await createSession(account, Constants.INTEGRATION_ID, `${localUrl}/oauthTest`);

  await authenticate({ page, targetUrl });

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

  const filter = (entry: { body: { data: { data: { propertyName: string; subscriptionType: string } } } }) =>
    entry.body.data.data.propertyName === 'website' &&
    entry.body.data.data.subscriptionType === 'contact.propertyChange';

  await updateContact(installId);
  await waitForWebhook(account, filter);
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
