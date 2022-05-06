import { cfg, request } from '../../../../test';
import connector from '../libc';
import { Internal } from '@fusebit-int/framework';
import nock from 'nock';

connector.middleware.authorizeUser = jest.fn();

const service_url = 'https://www.mockurl.com';
const authorize_path = '/authorize';
const token_path = '/token';

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

const emptyToken = {
  client_id: 'AAAAA',
  client_secret: 'BBBBB',
};

describe('Token Errors', () => {
  test('tokenUrl errors on an identity generate 429', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    // Return an expired token from fusebit storage
    fusebitApi.get(`${connectorUri}/identity/${entityId}`).reply(200, {
      data: { token: emptyToken },
    });

    // First PUT updates status to 'refreshing'
    fusebitApi
      .put(`${connectorUri}/identity/${entityId}`, (body) => {
        expect(body.data.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          status: 'refreshing',
        });
        return true;
      })
      .reply(200);

    // Report an error on the serviceAPI
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(500);

    // Expect it to put a refresh_error
    fusebitApi
      .put(`${connectorUri}/identity/${entityId}`, (body) => {
        expect(body.data.token.client_id).toBe(emptyToken.client_id);
        expect(body.data.token.client_secret).toBe(emptyToken.client_secret);
        expect(body.data.token.status).toBe('refresh_error');
        expect(body.data.token.refresh_at).toBeGreaterThan(Date.now() + 100);
        return true;
      })
      .reply(200);

    const tokenResult = await handle('GET', `/api/${entityId}/token`);
    expect(tokenResult.status).toBe(429);

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('tokenUrl errors persist to the session', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    // Return the supplied input parameters in the session
    fusebitApi.get(`${connectorUri}/session/${entityId}`).reply(200, { input: { ...emptyToken } });

    // First PUT updates output
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
        });
        return true;
      })
      .reply(200, (uri, requestBody) => requestBody);

    // Next GET re-gets the session in ensureAccessToken
    fusebitApi.get(`${connectorUri}/session/${entityId}`).reply(200, { input: { ...emptyToken } });

    // Write from ensureAccessToken with `refreshing` set.
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          status: 'refreshing',
        });
        return true;
      })
      .reply(200, (uri, requestBody) => requestBody);

    // Report an error from the serviceAPI
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(500);

    // First, it writes the refresh_error
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token.client_id).toBe(emptyToken.client_id);
        expect(body.output.token.client_secret).toBe(emptyToken.client_secret);
        expect(body.output.token.status).toBe('refresh_error');
        expect(body.output.token.refresh_at).toBeGreaterThan(Date.now() + 100);
        return true;
      })
      .reply(200, (uri, requestBody) => requestBody);

    // Then it writes the actual error to the session.
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body).toEqual({
          output: {
            error: 'Too Many Requests',
            errorDescription: 'Failed to acquire token from token server',
          },
        });
        return true;
      })
      .reply(200, (uri, requestBody) => requestBody);

    const tokenResult = await handle('GET', '/api/authorize', {}, { session: entityId });
    expect(tokenResult.status).toBe(302);

    expect(tokenResult.headers.location).toBe(
      `http://localhost:2222/v2/account/acc-123/subscription/sub-123/connector/con-123/session/${entityId}/callback`
    );

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('Waiting for a token to refresh waits correctly', async () => {
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    // Token has a refresh_error present; return 429.
    fusebitApi.get(`${connectorUri}/identity/${entityId}`).reply(200, {
      data: { token: { ...emptyToken, status: 'refresh_error', refresh_at: Date.now() + 20000 } },
    });

    const tokenResult = await handle('GET', `/api/${entityId}/token`);
    expect(tokenResult.status).toBe(429);

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
  });

  test('Waiting for a token to refresh errors when refresh takes too long', async () => {
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    // Token is currently refreshing...
    fusebitApi
      .get(`${connectorUri}/identity/${entityId}`)
      .reply(200, {
        data: { token: { ...emptyToken, status: 'refreshing' } },
      })
      .persist();

    const startTime = Date.now();
    const tokenResult = await handle('GET', `/api/${entityId}/token`);
    expect(tokenResult.status).toBe(429);
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThan(connector.maxWaitTime);
  }, 10000);
});
