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

const config: any = {
  ...cfg,
  configuration: {
    ...cfg.configuration,
    tokenUrl: `${service_url}${token_path}`,
    authorizationUrl: `${service_url}${authorize_path}`,
  },
};

const mockRequest = request('mock', 'mock');
const fusebit_url = mockRequest.fusebit.endpoint;
const connectorUri = `/v2${mockRequest.baseUrl.split('/v1')[1]}`;

const identityId = 'identityId';

const setupNock = (tokenPathCheck: (body: any) => boolean) => {
  const serviceScope = nock(service_url);

  serviceScope.post(token_path, tokenPathCheck).reply(200, updatedToken);

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
  fusebitApiIdentityScope.put(`${connectorUri}/identity/${identityId}`).reply(200);

  return { serviceScope, fusebitApiIdentityScope };
};

describe('Configuration: callbackUrl', () => {
  test('callbackUrl is based on mountUrl', async () => {
    const { fusebitApiIdentityScope, serviceScope } = setupNock((body) => {
      expect(body.redirect_uri).toEqual(`${fusebit_url}${connectorUri}/api/callback`);
      return true;
    });

    // Run test
    const manager = new Internal.Manager();
    manager.setup(config, connector.router, undefined);

    const tokenResult = await manager.handle(request('GET', `/api/${identityId}/token`));
    expect(tokenResult.status).toBe(200);

    // verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    expect(serviceScope.isDone()).toBeTruthy();
  });

  test('callbackUrl can be overwritten', async () => {
    const newCallbackUrl = 'https://www.monkeys.com/do/the/thing';
    const { fusebitApiIdentityScope, serviceScope } = setupNock((body) => {
      expect(body.redirect_uri).toEqual(newCallbackUrl);
      return true;
    });

    // Run test
    const manager = new Internal.Manager();

    // Set the callback url to something explicit
    config.configuration.callbackUrl = newCallbackUrl;
    manager.setup(config, connector.router, undefined);

    // Fire the request
    const tokenResult = await manager.handle(request('GET', `/api/${identityId}/token`));
    expect(tokenResult.status).toBe(200);

    // Verify that mocked routes have been called
    expect(fusebitApiIdentityScope.isDone()).toBeTruthy();
    expect(serviceScope.isDone()).toBeTruthy();
  });
});
