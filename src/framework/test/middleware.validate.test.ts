import { Integration, Internal } from '../src';

import { request, getIntegrationConfig } from './utilities';

const { Manager } = Internal;

const testResource = 'testResource';
const disallowedResource = 'invalidResource';

const testActions = ['install:get', 'connector:get'];
const disallowedActions = ['install:post', 'session:get'];

const createPermissionsOptions = (
  permissionResource = testResource,
  actions = testActions,
  requestedResource?: string
) => {
  return {
    state: {
      params: {
        resourcePath: requestedResource || permissionResource,
      },
    },
    caller: {
      permissions: {
        allow: actions.map((action) => ({
          resource: permissionResource,
          action,
        })),
      },
    },
  };
};

describe('Middleware: Validation', () => {
  test('Simple validation prevents invocation', async () => {
    const integration = new Integration();
    const Joi = integration.middleware.validate.joi;

    const handler = jest.fn();
    integration.router.get(
      '/api/test',
      integration.middleware.validate({ query: Joi.object({ aKey: Joi.string().required() }) }),
      handler
    );

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event
    await manager.handle(request('GET', '/api/test'));
    expect(handler).toBeCalledTimes(0);
  });

  test('Simple validation allows valid invocation', async () => {
    const integration = new Integration();
    const Joi = integration.middleware.validate.joi;

    const handler = jest.fn();
    integration.router.get(
      '/api/test',
      integration.middleware.validate({ query: Joi.object({ aKey: Joi.string().required() }) }),
      handler
    );

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event
    await manager.handle(request('GET', '/api/test', { query: { aKey: 'foobar' } }));
    expect(handler).toBeCalledTimes(1);
  });

  test('Authorize validation prevents access without permissions', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(testActions[0]), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event without permissions
    const result = await manager.handle(request('GET', '/api/test', createPermissionsOptions(testResource, [])));
    expect(result.status).toBe(403);
    expect(handler).toBeCalledTimes(0);
  });

  test('Authorize validation prevents access with invalid permissions', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(testActions[0]), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event without permissions
    const result = await manager.handle(
      request('GET', '/api/test', createPermissionsOptions(testResource, disallowedActions))
    );
    expect(result.status).toBe(403);
    expect(handler).toBeCalledTimes(0);
  });

  test('Authorize validation allows access', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(testActions[0]), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event with correct permissions
    const result = await manager.handle(request('GET', '/api/test', createPermissionsOptions()));
    expect(result.status).toBe(200);
    expect(handler).toBeCalledTimes(1);
  });

  test('Wildcard authorize validation prevents access without permissions', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event with correct permissions
    const result = await manager.handle(request('GET', '/api/test', createPermissionsOptions(testResource, [])));
    expect(result.status).toBe(403);
    expect(handler).toBeCalledTimes(0);
  });

  test('Wildcard authorize validation requires matching resource', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event with correct permissions
    const result = await manager.handle(
      request('GET', '/api/test', createPermissionsOptions(testResource, [], disallowedResource))
    );
    expect(result.status).toBe(403);
    expect(handler).toBeCalledTimes(0);
  });

  test('Wildcard authorize validation allows access with any permissions', async () => {
    const integration = new Integration();

    const handler = jest.fn();
    integration.router.get('/api/test', integration.middleware.authorizeUser(), handler);

    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    // Invoke the event with correct permissions
    const result = await manager.handle(
      request('GET', '/api/test', createPermissionsOptions(testResource, ["permission action doesn't matter"]))
    );
    expect(result.status).toBe(200);
    expect(handler).toBeCalledTimes(1);
  });
});
