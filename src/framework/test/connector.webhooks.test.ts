import nock from 'nock';
import Connector from '../src/client/Connector';
import { makeFanoutRequester } from '../src/client/FanoutRequest';
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
    const mockedValidateWebhookEvent = jest.fn(() => true);
    const mockedInitializationChallenge = jest.fn(() => true);

    class TestService extends Connector.Service {
      protected validateWebhookEvent = mockedValidateWebhookEvent;
      protected initializationChallenge = mockedInitializationChallenge;
    }

    class TestConnector extends Connector {
      protected createService() {
        return new TestService();
      }
    }

    const connector = new TestConnector();

    await connector.service.handleWebhookEvent(ctx);
    expect(ctx.status).toBe(200);
    expect(mockedValidateWebhookEvent).toBeCalledTimes(1);
    expect(mockedInitializationChallenge).toBeCalledTimes(1);
  });

  test('service.handleWebhookEvent raises exception when getEventsFromPayload is not overwritten', async () => {
    const ctx = getContext();
    try {
      const mockedValidateWebhookEvent = jest.fn(() => true);
      const mockedInitializationChallenge = jest.fn(() => false);

      class TestService extends Connector.Service {
        protected validateWebhookEvent = mockedValidateWebhookEvent;
        protected initializationChallenge = mockedInitializationChallenge;
      }

      class TestConnector extends Connector {
        protected createService() {
          return new TestService();
        }
      }

      const connector = new TestConnector();
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
    class TestService extends Connector.Service {
      protected async validateWebhookEvent() {
        return true;
      }
      protected initializationChallenge() {
        return false;
      }
      protected getEventsFromPayload() {
        return events;
      }
      protected getAuthIdFromEvent(ctx: Connector.Types.Context, event: any) {
        return event;
      }
      protected async createWebhookResponse(
        ctx: Connector.Types.Context,
        processPromise?: Promise<Connector.Types.FanoutResponse>
      ) {
        await processPromise;
      }
    }

    class TestConnector extends Connector {
      protected createService() {
        return new TestService();
      }
    }

    const connector = new TestConnector();

    // Mock some methods on service.

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
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${events[0]}`, (body) => true)
      .delay(responseDelay)
      .reply(200, events[0]);

    // Mock some methods on service.
    // Create the connector.
    class TestService extends Connector.Service {
      protected async validateWebhookEvent() {
        return true;
      }
      protected initializationChallenge() {
        return false;
      }
      protected getEventsFromPayload() {
        return events;
      }
      protected getAuthIdFromEvent(event: any) {
        return event;
      }
      protected async createWebhookResponse(
        ctx: Connector.Types.Context,
        processPromise?: Promise<Connector.Types.FanoutResponse>
      ) {
        await processPromise;
      }
    }

    class TestConnector extends Connector {
      protected createService() {
        return new TestService();
      }
    }

    const connector = new TestConnector();

    const webhookEvents = events.map((eventData) => connector.service.createWebhookEvent(ctx, eventData, 'e1'));
    const webhookEventId = connector.service.getWebhookLookupId(ctx, 'e1');

    // Create a Promise we can wait on.
    let writeResolve: () => void = jest.fn();
    const writePromise = new Promise((resolve) => (writeResolve = resolve));

    // Call the fanout
    const fanoutRequest = makeFanoutRequester(ctx, webhookEventId, webhookEvents, writeResolve);

    const fanoutPromise = fanoutRequest();

    // Wait for the write to complete
    await writePromise;

    // Make sure that the fanout promise itself completes after the nock delay
    const before = Date.now();
    await fanoutPromise;
    const after = Date.now();

    expect(after - before).toBeGreaterThan(responseDelay / 2);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });
});
