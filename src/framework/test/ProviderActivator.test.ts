import nock from 'nock';
import ProviderActivator from '../src/ProviderActivator';
import { Context } from '../src/Router';

const endpoint = 'http://somedeployment.fusebit.io';
const accountId = 'acc-0000000000000000';
const subscriptionId = 'sub-0000000000000000';
const entityId = 'some-integration-123';
const lookupKey = '9c852221-a086-4aec-bfc7-90d79b07dd8b';

nock(endpoint)
  .get(`/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/${lookupKey}/token`)
  .reply(200, {});

class ProviderActivatorImpl extends ProviderActivator<boolean> {
  ctx!: Context;
  lookupKey!: string;

  protected instantiate(ctx: Context, lookupKey: string): Promise<boolean> {
    throw Error('Not implemented');
  }

  callRequestConnectorToken(params: { ctx: any; lookupKey: string }): Promise<any> {
    return this.requestConnectorToken(params);
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
    const ctx = {
      state: {
        params: {
          endpoint,
          accountId,
          subscriptionId,
        },
      },
      throw: jest.fn(),
    };
    await activator.callRequestConnectorToken({
      ctx,
      lookupKey,
    });
    expect(ctx.throw).toHaveBeenCalledTimes(1);
    expect(ctx.throw).toHaveBeenCalledWith(
      404,
      `Cannot find Integration Instance ${lookupKey}. Has the tenant authorized this integration?`
    );
  });
});
