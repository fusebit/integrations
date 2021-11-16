import * as fs from 'fs';

import { expect } from '@playwright/test';

import { IAccount, waitForOperation, fusebitRequest, RequestMethod, postAndWait } from './sdk';

// const DEVELOPER_CONSOLE_LINK =
//   'https://developer.atlassian.com/console/myapps/d639ce0f-f387-45d1-8421-e6d3dc6288c7/authorization/auth-code-grant';

// Load the secrets from the environment
export const {
  OAUTH_USERNAME,
  OAUTH_PASSWORD,
  SECRET_CLIENTID,
  SECRET_CLIENTSECRET,
  INTEGRATION_ID,
  CONNECTOR_ID,
  SIGNING_SECRET,
} = process.env;

// A variety of constants used for testing this component.
export const TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize';

export const PACKAGE_CONNECTOR = '@fusebit-int/githubapp-connector';
export const PACKAGE_PROVIDER = '@fusebit-int/githubapp-provider';

// A GitHub app does not contain scopes, they're configured from the install step
// from an Org admin.
export const OAUTH_SCOPES = '';

const makeIntegration = () => ({
  id: INTEGRATION_ID,
  data: {
    componentTags: {},
    configuration: {},

    handler: './integration',
    components: [
      {
        name: CONNECTOR_ID,
        entityType: 'connector',
        entityId: CONNECTOR_ID,
        dependsOn: [],
        provider: PACKAGE_PROVIDER,
      },
    ],
    files: {
      'integration.js': fs.readFileSync('./play/mock/integration.js', 'utf8'),
      'package.json': JSON.stringify({ dependencies: { superagent: '*' } }),
    },
  },
});

const makeConnector = () => ({
  id: CONNECTOR_ID,
  data: {
    handler: PACKAGE_CONNECTOR,
    configuration: {
      mode: {
        useProduction: true,
      },
      scope: OAUTH_SCOPES,
      authorizationUrl: AUTHORIZATION_URL,
      tokenUrl: TOKEN_URL,
      clientId: SECRET_CLIENTID,
      clientSecret: SECRET_CLIENTSECRET,
      signingSecret: SIGNING_SECRET,
    },
  },
});

export const ensureEntities = async (account: IAccount) => {
  const recreateIntegration = async () => {
    let result = await fusebitRequest(account, RequestMethod.delete, `/integration/${INTEGRATION_ID}`);
    result = await waitForOperation(account, `/integration/${INTEGRATION_ID}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(account, `/integration/${INTEGRATION_ID}`, makeIntegration());
    expect(result).toBeHttp({ statusCode: 200 });
  };

  const recreateConnector = async () => {
    await fusebitRequest(account, RequestMethod.delete, `/connector/${CONNECTOR_ID}`);
    let result = await waitForOperation(account, `/connector/${CONNECTOR_ID}`);
    expect(result).toBeHttp({ statusCode: 404 });
    result = await postAndWait(account, `/connector/${CONNECTOR_ID}`, makeConnector());
    expect(result).toBeHttp({ statusCode: 200 });
  };

  await Promise.all([recreateIntegration(), recreateConnector()]);
};
