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

describe('Token Refresh', () => {
  test('Establish an identity from client_id and client_secret in token', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

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

    // Next, it queries the token URL and gets an access_token with an expires_at
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(200, { access_token: 'CCCCC', expires_at: expiresAt });

    // The completed token is saved on the identity
    fusebitApi
      .put(`${connectorUri}/identity/${entityId}`, (body) => {
        expect(body.data.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          access_token: 'CCCCC',
          expires_at: expiresAt,
        });
        expect(body.data.token.status).toBeUndefined();
        return true;
      })
      .reply(200, { ...emptyToken, access_token: 'CCCCC', expires_at: expiresAt });

    const tokenResult = await handle('GET', `/api/${entityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body).toEqual({
      client_id: emptyToken.client_id,
      access_token: 'CCCCC',
      expires_at: expiresAt,
    });

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('A valid identity returns a 200 on a health check', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

    // Return an expired token from fusebit storage
    fusebitApi
      .get(`${connectorUri}/identity/${entityId}`)
      .reply(200, { data: { token: { ...emptyToken, access_token: 'CCCCC', expires_at: expiresAt } } });

    // The healthcheck returns success
    const tokenResult = await handle('GET', `/api/${entityId}/health`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body).toBeUndefined();

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('An valid session with a populated output including a token returns a token', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

    // Return an expired token from fusebit storage
    fusebitApi
      .get(`${connectorUri}/session/${entityId}`)
      .reply(200, { output: { token: { ...emptyToken, access_token: 'CCCCC', expires_at: expiresAt } } });

    // The token is returned
    const tokenResult = await handle('GET', `/api/session/${entityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body).toEqual({
      access_token: 'CCCCC',
      client_id: emptyToken.client_id,
      expires_at: expiresAt,
    });

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('An valid session with a populated input generates a token', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

    // Return the supplied input parameters in the session
    fusebitApi.get(`${connectorUri}/session/${entityId}`).reply(200, { input: { ...emptyToken } });

    // First PUT updates status to 'refreshing'
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          status: 'refreshing',
        });
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    // Next, it queries the token URL and gets an access_token with an expires_at
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(200, { access_token: 'CCCCC', expires_at: expiresAt });

    // The completed token is saved on the session
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          access_token: 'CCCCC',
          expires_at: expiresAt,
        });
        expect(body.output.token.status).toBeUndefined();
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    // The token request returns success
    const tokenResult = await handle('GET', `/api/session/${entityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body).toEqual({
      access_token: 'CCCCC',
      client_id: emptyToken.client_id,
      expires_at: expiresAt,
    });

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('An valid session with a output without an access_token generates a token', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

    // Return an token without an access_key in the output
    fusebitApi.get(`${connectorUri}/session/${entityId}`).reply(200, { output: { token: emptyToken } });

    // First PUT updates status to 'refreshing'
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          status: 'refreshing',
        });
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    // Next, it queries the token URL and gets an access_token with an expires_at
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(200, { access_token: 'CCCCC', expires_at: expiresAt });

    // The completed token is saved on the session
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          access_token: 'CCCCC',
          expires_at: expiresAt,
        });
        expect(body.output.token.status).toBeUndefined();
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    const tokenResult = await handle('GET', `/api/session/${entityId}/token`);
    expect(tokenResult.status).toBe(200);
    expect(tokenResult.body).toEqual({
      access_token: 'CCCCC',
      client_id: emptyToken.client_id,
      expires_at: expiresAt,
    });

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });

  test('Deleting an identity works', async () => {
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    // Return an expired token from fusebit storage
    fusebitApi.delete(`${connectorUri}/identity/${entityId}`).reply(204);

    const tokenResult = await handle('DELETE', `/api/${entityId}`);
    expect(tokenResult.status).toBe(204);
  });

  test('Authorizing a session results in a valid token and redirect', async () => {
    const serviceApi = nock(service_url).defaultReplyHeaders({ 'content-type': 'application/json' });
    const fusebitApi = nock(fusebit_url).defaultReplyHeaders({ 'content-type': 'application/json' });

    const entityId = 'entityId';

    const expiresAt = Date.now() + 500000;

    // Return the supplied input parameters in the session
    fusebitApi.get(`${connectorUri}/session/${entityId}`).reply(200, { input: { ...emptyToken } });

    // PUT updates the output to include the credentials
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual(emptyToken);
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    // Get from ensureAccessToken, return the supplied input parameters in the session
    fusebitApi
      .get(`${connectorUri}/session/${entityId}`)
      .reply(200, { input: { ...emptyToken }, output: { ...emptyToken } });

    // PUT updates the output to include the credentials but with status==refreshing
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          status: 'refreshing',
        });
        return true;
      })
      .reply(200, {});

    // Next, it queries the token URL and gets an access_token with an expires_at
    serviceApi
      .get(token_path)
      .query({ client_id: emptyToken.client_id, client_secret: emptyToken.client_secret })
      .reply(200, { access_token: 'CCCCC', expires_at: expiresAt });

    // The completed token is saved on the session
    fusebitApi
      .put(`${connectorUri}/session/${entityId}`, (body) => {
        expect(body.output.token).toEqual({
          client_id: emptyToken.client_id,
          client_secret: emptyToken.client_secret,
          access_token: 'CCCCC',
          expires_at: expiresAt,
        });
        expect(body.output.token.status).toBeUndefined();
        return true;
      })
      .reply(200, {
        id: entityId,
        tags: [],
      });

    // The authorize returns an appropriate 302
    const tokenResult = await handle('GET', '/api/authorize', {}, { session: entityId });
    expect(tokenResult.status).toBe(302);

    expect(tokenResult.headers.location).toBe(
      `http://localhost:2222/v2/account/acc-123/subscription/sub-123/connector/con-123/session/${entityId}/callback`
    );

    // verify that mocked routes have been called
    expect(fusebitApi.isDone()).toBeTruthy();
    expect(serviceApi.isDone()).toBeTruthy();
  });
});
