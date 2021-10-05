import { Connector, Integration, Internal } from '../src';

import { request, Constants, getIntegrationConfig } from './utilities';

const { Manager } = Internal;

describe('Event Hook', () => {
  test('Payload must be supplied', async () => {
    const integration = new Integration();
    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    const result = await manager.handle(request('POST', '/event/someEvent', { body: {} }));
    expect(result.status).toBe(400);
    expect(result.body.status).toBe(400);
  });

  test('Events must be present', async () => {
    const integration = new Integration();
    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    const result = await manager.handle(request('POST', '/event/someEvent', { body: { payload: {} } }));
    expect(result.status).toBe(400);
    expect(result.body.status).toBe(400);
  });

  test('Events must be in the right format', async () => {
    const integration = new Integration();
    const manager = new Manager();
    manager.setup(getIntegrationConfig(), integration.router);

    const result = await manager.handle(request('POST', '/event/someEvent', { body: { payload: [{ foo: 5 }] } }));
    expect(result.status).toBe(400);
    expect(result.body.status).toBe(400);
  });

  test('Valid events are accepted', async () => {
    const eventType = 'anEventType';
    const event: Connector.Types.IWebhookEvent = {
      data: 'some data',
      eventType,
      entityId: Constants.connectorId,
      webhookEventId: 'someEventId',
      webhookAuthId: '5',
    };

    // Add a sample connector
    const integration = new Integration();
    const manager = new Manager();
    manager.setup(getIntegrationConfig({ withDummyConnector: true }), integration.router);

    // Validate that the event is received but the individual event isn't handled
    const result = await manager.handle(request('POST', '/event/someEvent', { body: { payload: [event] } }));
    expect(result.status).toBe(200);
    expect(result.body[0].status).toBe(404);
  });

  test('Valid events are routed into the integration', async () => {
    const eventType = 'anEventType';
    const eventMode = 'anEventMode';

    const event: Connector.Types.IWebhookEvent = {
      data: 'some data',
      eventType,
      entityId: Constants.connectorId,
      webhookEventId: 'someEventId',
      webhookAuthId: '5',
    };

    const integration = new Integration();

    // Add a handler to validate the integrity of the EventContext
    const handler = jest.fn(async (ctx: Internal.Types.EventContext) => {
      // Validate that the ctx.event object looks correct.
      expect(ctx.event).toMatchObject({
        eventType,
        eventSourceId: Constants.connectorId,
        eventSourceType: 'connector',
      });

      expect(ctx.req.body).toMatchObject(event);
    });
    integration.event.on(`/${Constants.connectorName}/${eventMode}/${eventType}`, handler);

    const manager = new Manager();
    // Add a sample connector
    manager.setup(getIntegrationConfig({ withDummyConnector: true }), integration.router);

    // Invoke the event
    const result = await manager.handle(request('POST', `/event/${eventMode}`, { body: { payload: [event] } }));

    // Validate the results
    expect(result.status).toBe(200);
    expect(result.body[0].status).toBe(200);
    expect(result.body[0].message).toBe('ok');
    expect(handler).toBeCalledTimes(1);
  });
});
