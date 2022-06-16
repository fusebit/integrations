import nock from 'nock';
import { ProviderActivator } from '../src/provider';
import { FusebitContext } from '../src/router';
import { Constants, getContext } from './utilities';

const { endpoint, accountId, subscriptionId } = Constants;
const entityId = 'some-integration-123';
const goodIdentityLookupKey = 'idn-01234567890123456789012345678901';
const goodSessionLookupKey = 'sid-01234567890123456789012345678901';
const badIdentityLookupKey = 'idn-01234567890123456789012345678902';
const badSessionLookupKey = 'sid-01234567890123456789012345678902';

nock(endpoint)
  .get(
    `/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/${goodIdentityLookupKey}/token`
  )
  .reply(200, { a: 'b' });

nock(endpoint)
  .get(
    `/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/session/${goodSessionLookupKey}/token`
  )
  .reply(200, { a: 'b' });

// We consider a empty response to be a token that's not found
nock(endpoint)
  .get(
    `/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/${badIdentityLookupKey}/token`
  )
  .reply(200, {});

nock(endpoint)
  .get(
    `/v2/account/${accountId}/subscription/${subscriptionId}/connector/${entityId}/api/session/${badSessionLookupKey}/token`
  )
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
  test('Get Identity token works', async () => {
    const ctx = getContext();
    const token = await activator.callRequestConnectorToken({
      ctx,
      lookupKey: goodIdentityLookupKey,
    });
    expect(token).toEqual({ a: 'b' });
  });

  test('Get Session token works', async () => {
    const ctx = getContext();
    const token = await activator.callRequestConnectorToken({
      ctx,
      lookupKey: goodSessionLookupKey,
    });
    expect(token).toEqual({ a: 'b' });
  });

  test('Raise exception when Identity is not found', async () => {
    const ctx = getContext();
    try {
      await activator.callRequestConnectorToken({
        ctx,
        lookupKey: badIdentityLookupKey,
      });
      fail('an exception should have been raised');
    } catch (err) {
      expect(ctx.throw).toHaveBeenCalledTimes(1);
      expect(ctx.throw).toHaveBeenCalledWith(
        404,
        `Cannot find Integration Identity '${badIdentityLookupKey}'. Has the tenant authorized this integration?`
      );
    }
  });

  test('Raise exception when Session is not found', async () => {
    const ctx = getContext();
    try {
      await activator.callRequestConnectorToken({
        ctx,
        lookupKey: badSessionLookupKey,
      });
      fail('an exception should have been raised');
    } catch (err) {
      expect(ctx.throw).toHaveBeenCalledTimes(1);
      expect(ctx.throw).toHaveBeenCalledWith(
        404,
        `Cannot find Integration Session '${badSessionLookupKey}'. Has the tenant authorized this integration?`
      );
    }
  });
});
