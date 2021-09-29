import { Integration, Internal } from '../src';

import { request, getIntegrationConfig } from './utilities';

const { Manager } = Internal;

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
});
