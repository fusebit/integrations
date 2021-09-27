import { Internal } from '../src';
const { Manager } = Internal;

describe('Context', () => {
  it('validate routable contexts have correct values', async () => {
    const manager = new Manager();

    const fctx = {
      path: '/PATH',
      method: 'XXX',
      accountId: 'accountId',
      subscriptionId: 'subscriptionId',
      boundaryId: 'boundaryId',
      functionId: 'functionId',
      baseUrl: 'baseUrl',
      query: {
        query1: 'query1_value',
      },
      headers: {
        header1: 'header1_value',
      },
    };

    const kctx = manager.createRouteableContext(fctx);
    expect(kctx.header.header1).toBe(fctx.headers.header1);
    expect(kctx.method).toBe(fctx.method);
    expect(kctx.query.query1).toBe(fctx.query.query1);
    expect(kctx.state.params).toMatchObject({
      accountId: fctx.accountId,
      subscriptionId: fctx.subscriptionId,
    });
    expect(kctx.state.params.boundaryId).toBeUndefined();
    expect(kctx.state.params.functionId).toBeUndefined();
  });
});
