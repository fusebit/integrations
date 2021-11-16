import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

jest.mock('jwks-rsa');
jest.mock('jsonwebtoken');

describe('Microsoft Bot Framework Connector', () => {
  test('Check validateWebhookEvent', async () => {
    const scope = nock('https://login.botframework.com/v1/.well-known/openidconfiguration')
      .get('', () => true)
      .reply(200);

    const service: any = new ServiceConnector.Service();
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    await service.validateWebhookEvent(ctx);

    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });

  test('Check validateWebhookEvent throws errors', async () => {
    const service: any = new ServiceConnector.Service();
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;

    ctx.req.headers.authorization = 'bearer';

    try {
      await service.validateWebhookEvent(ctx);
      fail('Should have raised exception.');
    } catch (err) {
      expect(ctx.throw).toBeCalledWith(403, 'Invalid authorization');
    }

    delete ctx.req.headers.authorization;

    try {
      await service.validateWebhookEvent(ctx);
      fail('Should have raised exception.');
    } catch (err) {
      expect(ctx.throw).toBeCalledWith(403, 'Invalid authorization');
    }
  });
});
