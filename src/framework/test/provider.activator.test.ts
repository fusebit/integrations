import nock from 'nock';
import ProviderActivator from '../src/ProviderActivator';
import { FusebitContext } from '../src/router';
import { Constants, getContext } from './utilities';

const { endpoint, accountId, subscriptionId } = Constants;
const entityId = 'some-integration-123';
const lookupKey = 'idn-01234567890123456789012345678901';

const ctx = getContext();

nock(endpoint)
  .get(`/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/${lookupKey}/token`)
  .reply(200, {});

class ProviderActivatorImpl extends ProviderActivator<boolean> {
  public instantiate(ctx: FusebitContext, lookupKey: string): Promise<boolean> {
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
  test('Raise exception when Identity is not found', async () => {
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
        `Cannot find Integration Identity '${lookupKey}'. Has the tenant authorized this integration?`
      );
    }
  });
});
