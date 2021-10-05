import Connector from '../src/client/Connector';
import { getContext } from './utilities';

describe('Connector', () => {
  test('service.handleWebhookEvent raises exception when validateWebhookEvent is not overwritten', () => {
    const ctx = getContext(true);
    try {
      const connector = new Connector();
      connector.service.handleWebhookEvent(ctx as any);
      fail('should have raised exception');
    } catch (err) {
      expect(ctx.throw).toBeCalledTimes(1);
      expect(ctx.throw).toBeCalledWith(
        500,
        'Webhook Validation configuration missing. Required for webhook processing.'
      );
    }
  });

  test('service.handleWebhookEvent returns 200 on valid challenge', () => {
    const ctx = getContext(true);
    const connector = new Connector();
    const mockedValidateWebhookEvent = jest.fn(() => true);
    const mockedInitializationChallenge = jest.fn(() => true);
    connector.service.setValidateWebhookEvent(mockedValidateWebhookEvent);
    connector.service.setInitializationChallenge(mockedInitializationChallenge);
    connector.service.handleWebhookEvent(ctx as any);
    expect(ctx.status).toBe(200);
    expect(mockedValidateWebhookEvent).toBeCalledTimes(1);
    expect(mockedInitializationChallenge).toBeCalledTimes(1);
  });

  test('service.handleWebhookEvent raises exception when getEventsFromPayload is not overwritten', () => {
    const ctx = getContext(true);
    try {
      const connector = new Connector();
      const mockedValidateWebhookEvent = jest.fn(() => true);
      const mockedInitializationChallenge = jest.fn(() => false);
      connector.service.setValidateWebhookEvent(mockedValidateWebhookEvent);
      connector.service.setInitializationChallenge(mockedInitializationChallenge);
      connector.service.handleWebhookEvent(ctx as any);
      fail('should have raised exception');
    } catch (err) {
      expect(ctx.throw).toBeCalledTimes(1);
      expect(ctx.throw).toBeCalledWith(500, 'Event location configuration missing. Required for webhook processing.');
    }
  });
});
