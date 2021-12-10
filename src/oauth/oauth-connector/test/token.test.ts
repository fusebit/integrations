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
  timestamp: Date.now(),
  refreshErrorCount: 0,
  unique_original_value: 'unique_original_value',
};

type Token = typeof token;
interface IRefreshToken extends Omit<Token, 'unique_original_value'> {
  refresh_token: string;
  unique_original_value?: null;
}

const tokenWithRefresh: IRefreshToken = {
  ...token,
  refresh_token: 'refresh_token',
  unique_original_value: null,
};
delete tokenWithRefresh.unique_original_value;

const expiredToken = {
  ...tokenWithRefresh,
  expires_at: Date.now(),
};
const updatedToken = {
  ...token,
  access_token: 'updated_access_token',
  unique_updated_value: 'unique_updated_value',
};
const updatedTokenWithRefresh = {
  ...updatedToken,
  refresh_token: 'updated_refresh_token',
};

const config = {
  ...cfg,
  configuration: {
    ...cfg.configuration,
    tokenUrl: `${service_url}${token_path}`,
    authorizationUrl: `${service_url}${authorize_path}`,
  },
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
        data: { token: expiredToken },
      });

    // first put updates expires_at, can ignore
    fusebitApiIdentityScope.put(`${connectorUri}/identity/${identityId}`).reply(200);
    fusebitApiIdentityScope
      .put(`${connectorUri}/identity/${identityId}`, (body) => {
        // verify that new token includes previous refresh token but updated access_token
        expect(body.data.token.refresh_token).toEqual(expiredToken.refresh_token);
        expect(body.data.token.access_token).toEqual(updatedToken.access_token);
        // verify that returned token reflects exact overwrite spread with no additional values
        const expectedToken = { ...expiredToken, ...updatedToken, expires_at: body.data.token.expires_at };
        expect(body.data.token).toEqual(expectedToken);
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
        data: { token: expiredToken },
      });

    // first put updates expires_at, can ignore
    fusebitApiIdentityScope.put(`${connectorUri}/identity/${identityId}`).reply(200);
    fusebitApiIdentityScope
      .put(`${connectorUri}/identity/${identityId}`, (body) => {
        expect(body.data.token.refresh_token).toEqual(updatedTokenWithRefresh.refresh_token);
        expect(body.data.token.access_token).toEqual(updatedTokenWithRefresh.access_token);
        // verify that returned token reflects exact overwrite spread with no additional values
        const expectedToken = { ...expiredToken, ...updatedTokenWithRefresh, expires_at: body.data.token.expires_at };
        expect(body.data.token).toEqual(expectedToken);
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
    fusebitApiIdentityScope.get(`${connectorUri}/identity/${identityId}`).reply(200, {
      data: { tokenWithRefresh },
    });

    const tokenResult = await handle('GET', `/api/${identityId}/token`);
    expect(tokenResult.status).toBe(200);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    // verify that refresh has not been requested
    expect(serviceScope.isDone()).toBeFalsy();
  });
});
