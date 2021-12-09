import { cfg, request } from '../../../../test';
import connector from '../libc';
import { Internal } from '@fusebit-int/framework';
import nock from 'nock';

connector.middleware.authorizeUser = jest.fn();

const service_url = 'https://www.mockurl.com';
const authorize_path = '/authorize';
const token_path = '/token';

const token = {
  access_token: 'access_token',
  token_type: 'Bearer',
  expires_in: 100000,
  scope: '',
  status: 'authenticated',
  timestamp: Date.now().toString(),
  refreshErrorCount: 0
};
const tokenWithRefresh = {
  ...token,
  refresh_token: 'refresh_token'
};
const expiredToken = {
  ...tokenWithRefresh,
  expires_at: Date.now().toString()
};
const updatedToken = {
  ...token,
  access_token: 'updated_access_token'
};
const updatedTokenWithRefresh = {
  ...updatedToken,
  refresh_token: 'updated_refresh_token'
};

const config = {
  ...cfg,
  configuration: {
    ...cfg.configuration,
    tokenUrl: `${service_url}${token_path}`,
    authorizationUrl: `${service_url}${authorize_path}`,
  }
};

const manager = new Internal.Manager();
manager.setup(config, connector.router, undefined);
const handle = (method: string, path: string, headers?: any, query?: any, body?: any) => {
  return manager.handle(request(method, path, headers, query, body));
};

const mockRequest = request('mock', 'mock');
const fusebit_url = mockRequest.fusebit.endpoint;
const connectorUri = `/v2${mockRequest.baseUrl.split('/v1')[1]}`;

describe('Refresh-Tokens', () => {
  test('validate Refresh Token preserved when absent on refresh', async () => {

    const serviceScope = nock(service_url);

    // return a token w/o a refresh_token value when refreshing
    serviceScope.post(token_path).reply(200, updatedToken);

    const identityId = 'identityId';
    const fusebitApiIdentityScope = nock(fusebit_url);

    // return an expired token from fusebit storage
    fusebitApiIdentityScope
      .get(`${connectorUri}/identity/${identityId}`)
      .twice()
      .reply(200, {
        data: { token: expiredToken }
      });

    // first put updates expires_at, can ignore
    fusebitApiIdentityScope.put(`${connectorUri}/identity/${identityId}`).reply(200);
    // verify that updated token includes previous refresh token
    fusebitApiIdentityScope
      .put(`${connectorUri}/identity/${identityId}`, (body) => {
        expect(body.data.token.refresh_token).toEqual(tokenWithRefresh.refresh_token);
        expect(body.data.token.access_token).toEqual(updatedToken.access_token);
        return true;
      })
      .reply(200);

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    expect(serviceScope.isDone()).toBeTruthy();

  });

  test('validate Refresh Token updates when provided by refresh', async () => {

    const serviceScope = nock(service_url);

    // return a token w/ a refresh_token value when refreshing
    serviceScope.post(token_path).reply(200, updatedTokenWithRefresh);

    const identityId = 'identityId';
    const fusebitApiIdentityScope = nock(fusebit_url);

    // return an expired token from fusebit storage
    fusebitApiIdentityScope
      .get(`${connectorUri}/identity/${identityId}`)
      .twice()
      .reply(200, {
        data: { token: expiredToken }
      });

    // first put updates expires_at, can ignore
    fusebitApiIdentityScope.put(`${connectorUri}/identity/${identityId}`).reply(200);
    // verify that updated token includes new refresh token
    fusebitApiIdentityScope
      .put(`${connectorUri}/identity/${identityId}`, (body) => {
        expect(body.data.token.refresh_token).toEqual(updatedTokenWithRefresh.refresh_token);
        expect(body.data.token.access_token).toEqual(updatedTokenWithRefresh.access_token);
        return true;
      })
      .reply(200);

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    expect(serviceScope.isDone()).toBeTruthy();

  });

  test('validate token does not refresh if expires_at not passed', async () => {

    const serviceScope = nock(service_url);

    // mocked route to verify refresh is not requested
    serviceScope.post(token_path).reply(200);

    const identityId = 'identityId';
    const fusebitApiIdentityScope = nock(fusebit_url);

    // return a non-expired token from fusebit storage
    fusebitApiIdentityScope
      .get(`${connectorUri}/identity/${identityId}`)
      .reply(200, {
        data: { tokenWithRefresh }
      });

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    // verify that refresh has not been requested
    expect(serviceScope.isDone()).toBeFalsy();

  });
});
