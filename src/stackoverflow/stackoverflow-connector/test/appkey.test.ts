import nock from 'nock';

import { cfg, request } from '../../../../test';
import { Internal } from '@fusebit-int/framework';

import connector from '../src';

const serviceUrl = 'https://www.mockurl.com';
const authorizePath = '/authorize';
const tokenPath = '/token';

const mockRequest = request('mock', 'mock');
const fusebitUrl = mockRequest.fusebit.endpoint;
const connectorUri = `/v2${mockRequest.baseUrl.split('/v1')[1]}`;

const token = {
  access_token: 'access_token',
  token_type: 'Bearer',
  expires_in: 100000,
  scope: '',
  status: 'authenticated',
  timestamp: Date.now(),
  refreshErrorCount: 0,
  unique_original_value: 'unique_original_value',
  refresh_token: 'refresh_token',
};

const config = {
  ...cfg,
  configuration: {
    ...cfg.configuration,
    tokenUrl: `${serviceUrl}${tokenPath}`,
    authorizationUrl: `${serviceUrl}${authorizePath}`,
    clientKey: 'TEST_CONNECTOR_CLIENT_KEY',
  },
};

const manager = new Internal.Manager();
manager.setup(config, connector.router, undefined);
const handle = (method: string, path: string, headers?: any, query?: any, body?: any) => {
  return manager.handle(request(method, path, headers, query, body));
};

describe('Client Key', () => {
  test('Validate connector client key is returned when token does not include the key', async () => {
    const identityId = 'identityId';
    const fusebitApiIdentityScope = nock(fusebitUrl);

    // return a non-expired token from fusebit storage - twice, for some reason?
    fusebitApiIdentityScope.get(`${connectorUri}/identity/${identityId}`).twice().reply(200, {
      data: { token },
    });

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body.client_key).toBe(config.configuration.clientKey);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
  });

  test('Validate token client key is returned on a token request when token includes the key', async () => {
    const identityId = 'identityId';
    const fusebitApiIdentityScope = nock(fusebitUrl);

    // return a non-expired token from fusebit storage - twice, for some reason?
    fusebitApiIdentityScope
      .get(`${connectorUri}/identity/${identityId}`)
      .twice()
      .reply(200, {
        data: { token: { ...token, client_key: 'TEST_TOKEN_CLIENT_KEY' } },
      });

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body.client_key).toBe('TEST_TOKEN_CLIENT_KEY');

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
  });
});
