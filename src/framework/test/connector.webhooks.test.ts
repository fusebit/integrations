import nock from 'nock';
import Connector from '../src/client/Connector';
import { FusebitContext } from '../src/router';
import { Constants, getContext } from './utilities';

describe('Connector', () => {
  test('service.handleWebhookEvent raises exception when validateWebhookEvent is not overwritten', async () => {
    const ctx = getContext();
    try {
      const connector = new Connector();
      await connector.service.handleWebhookEvent(ctx);
      fail('should have raised exception');
    } catch (err) {
      expect(ctx.throw).toBeCalledTimes(1);
      expect(ctx.throw).toBeCalledWith(
        500,
        'Webhook Validation configuration missing. Required for webhook processing.'
      );
    }
  });

  test('service.handleWebhookEvent returns 200 on valid challenge', async () => {
    const ctx = getContext();
    const connector = new Connector();
    const mockedValidateWebhookEvent = jest.fn(() => true);
    const mockedInitializationChallenge = jest.fn(() => true);
    connector.service.setValidateWebhookEvent(mockedValidateWebhookEvent);
    connector.service.setInitializationChallenge(mockedInitializationChallenge);
    await connector.service.handleWebhookEvent(ctx);
    expect(ctx.status).toBe(200);
    expect(mockedValidateWebhookEvent).toBeCalledTimes(1);
    expect(mockedInitializationChallenge).toBeCalledTimes(1);
  });

  test('service.handleWebhookEvent raises exception when getEventsFromPayload is not overwritten', async () => {
    const ctx = getContext();
    try {
      const connector = new Connector();
      const mockedValidateWebhookEvent = jest.fn(() => true);
      const mockedInitializationChallenge = jest.fn(() => false);
      connector.service.setValidateWebhookEvent(mockedValidateWebhookEvent);
      connector.service.setInitializationChallenge(mockedInitializationChallenge);
      await connector.service.handleWebhookEvent(ctx);
      fail('should have raised exception');
    } catch (err) {
      expect(ctx.throw).toBeCalledTimes(1);
      expect(ctx.throw).toBeCalledWith(500, 'Event location configuration missing. Required for webhook processing.');
    }
  });

  test('service.handleWebhookEvent dispatches events to fan-out', async () => {
    const ctx = getContext();
    ctx.state.manager = { config: { defaultEventHandler: false } };
    ctx.state.params.entityId = Constants.connectorId;

    // Define the events.
    const events = ['e1', 'e2', 'e3'];

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    events.forEach((event) =>
      scope
        .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${event}`, (body) => true)
        .reply(200, event)
    );

    // Create the connector.
    const connector = new Connector();

    // Mock some methods on service.
    connector.service.setValidateWebhookEvent(() => true);
    connector.service.setInitializationChallenge(() => false);
    connector.service.setGetEventsFromPayload(() => events);
    connector.service.setGetAuthIdFromEvent((event) => event);
    connector.service.setCreateWebhookResponse(async (ctx, processPromise) => {
      await processPromise;
    });

    // Trigger the handler.
    await connector.service.handleWebhookEvent(ctx);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });

  test('fanoutEvent closes on write complete', async () => {
    const responseDelay = 200;
    const ctx = getContext();
    ctx.state.manager = { config: { defaultEventHandler: false } };
    ctx.state.params.entityId = Constants.connectorId;

    // Define the events.
    const events = ['e1'];

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    events.forEach((event) =>
      scope
        .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${event}`, (body) => true)
        .delay(responseDelay)
        .reply(200, event)
    );

    // Create the connector.
    const connector = new Connector();

    // Mock some methods on service.
    connector.service.setValidateWebhookEvent(() => true);
    connector.service.setInitializationChallenge(() => false);
    connector.service.setGetEventsFromPayload(() => events);
    connector.service.setGetAuthIdFromEvent((event) => event);
    connector.service.setCreateWebhookResponse(async (ctx, processPromise) => {
      await processPromise;
    });

    // Create a Promise we can wait on.
    let writeResolve: () => void = jest.fn();
    const writePromise = new Promise((resolve) => (writeResolve = resolve));

    // Delay long enough for writeResolve to get set
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Call the fanout
    const fanOutPromise = connector.service.fanoutEvent(ctx, 'e1', ['e1'], writeResolve);

    // Wait for the write to complete
    await writePromise;

    // Make sure that the fanout promise itself completes after the nock delay
    const before = Date.now();
    await fanOutPromise;
    const after = Date.now();

    expect(after - before).toBeGreaterThan(responseDelay / 2);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });
});
