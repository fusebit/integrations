import nock from 'nock';
import ProviderActivator from '../src/ProviderActivator';
import { FusebitContext } from '../src/router';
import { Constants, getContext } from './utilities';

const { endpoint, accountId, subscriptionId } = Constants;
const entityId = 'some-integration-123';
const lookupKey = '9c852221-a086-4aec-bfc7-90d79b07dd8b';

const ctx = getContext();

nock(endpoint)
  .get(`/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/${lookupKey}/token`)
  .reply(200, {});

class ProviderActivatorImpl extends ProviderActivator<boolean> {
  protected instantiate(ctx: FusebitContext, lookupKey: string): Promise<boolean> {
    throw Error('Not implemented');
  }

  callRequestConnectorToken(params: { ctx: Partial<FusebitContext>; lookupKey: string }): Promise<any> {
    return this.requestConnectorToken(params as { ctx: FusebitContext; lookupKey: string });
  }
}

const activator = new ProviderActivatorImpl({
  name: 'Test',
  path: 'test',
  provider: 'test-sdk',
  entityId,
  entityType: 'some-integration',
});

describe('ProviderActivator', () => {
  test('Raise exception when instance not found', async () => {
    try {
      await activator.callRequestConnectorToken({
        ctx,
        lookupKey,
      });
      fail('an exception should have been raised');
    } catch (err) {
      expect(ctx.throw).toHaveBeenCalledTimes(1);
      expect(ctx.throw).toHaveBeenCalledWith(
        404,
        `Cannot find Integration Instance ${lookupKey}. Has the tenant authorized this integration?`
      );
    }
  });
});
