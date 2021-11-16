import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';
import { Connector } from '@fusebit-int/framework';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

class MockedService extends ServiceConnector.Service {
  protected async validateWebhookEvent(ctx: Connector.Types.Context): Promise<boolean> {
    return Promise.resolve(true);
  }
}

jest.mock('jwks-rsa');
jest.mock('jsonwebtoken');

describe('Microsoft Bot Framework Webhook Events', () => {
  test('Check handleWebhookEvent', async () => {
    const fakeAccessToken = 'ey...';

    nock(sampleConfig.configuration.tokenUrl)
      .get('', () => true)
      .reply(200, {
        access_token: fakeAccessToken,
      });

    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, { event: sampleEvent });

    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(
        `/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}&default=${sampleConfig.configuration.defaultEventHandler}`,
        (body) => {
          // Here we validate that the provider will get the bot credentials to be able
          // to communicate with Microsoft Bot Framework and that the original event
          // was properly nested under data.event.
          const { data } = body.payload[0];
          const expectedCredentials = {
            accessToken: fakeAccessToken,
            botClientId: sampleConfig.configuration.clientId,
          };
          const expectedEvent = sampleEvent;
          expect(data.credentials).toMatchObject(expectedCredentials);
          expect(data.event).toMatchObject(expectedEvent);
          return true;
        }
      )
      .reply(200);

    const service: any = new MockedService();
    await service.handleWebhookEvent(ctx);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });

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
