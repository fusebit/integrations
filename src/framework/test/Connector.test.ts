import Connector from '../src/client/Connector';
import { getContext } from './utilities';

const connector = new Connector();

describe('Connector', () => {
  test('service.handleWebhookEvent raises exception when validateWebhookEvent is not overwritten', () => {
    const ctx = getContext(true);
    try {
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
});
