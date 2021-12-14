import { Internal } from '../src';
const { Manager } = Internal;

describe('Context', () => {
  test('validate routable contexts have correct values', async () => {
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

  test('cookies get passed through and back again', async () => {
    const manager = new Manager();

    const fctx = {
      path: '/PATH',
      method: 'GET',
      accountId: 'accountId',
      subscriptionId: 'subscriptionId',
      boundaryId: 'boundaryId',
      functionId: 'functionId',
      baseUrl: 'baseUrl',
      query: {
        query1: 'query1_value',
      },
      headers: {
        cookie: 'session=abcdef',
        header1: 'header1_value',
      },
    };

    const kctx = manager.createRouteableContext(fctx);
    expect(kctx.header.cookie).toBe(fctx.headers.cookie);

    // Set the headers a couple of different ways
    kctx.res.setHeader('set-cookie', 'foobar=muh');
    kctx.set('header2', 'header2_val');

    // Validate that the response created by the manager contains the headers
    const result = manager.createResponse(kctx);
    expect(result.headers['set-cookie']).toBe('foobar=muh');
    expect(result.headers['header2']).toBe('header2_val');
  });

  test('Buffers get converted into base64 with a bodyEncoding', async () => {
    const manager = new Manager();

    const fctx = {
      path: '/PATH',
      method: 'GET',
      accountId: 'accountId',
      subscriptionId: 'subscriptionId',
      boundaryId: 'boundaryId',
      functionId: 'functionId',
      baseUrl: 'baseUrl',
    };

    const kctx = manager.createRouteableContext(fctx);
    const buffer = Buffer.from('AAAAAAA', 'utf8');
    kctx.body = buffer;

    const result = manager.createResponse(kctx);
    expect(result.bodyEncoding).toBe('base64');
    expect(result.body).toBe(buffer.toString('base64'));
  });
});
