import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleConfig } from './sampleData';

const linearWebhookIPSource = '35.231.147.226';

const sampleCtx: any = {
  req: {
    headers: {
      // Linear utilizes IP based whitelisting. there isn't a easy way to get a request
      // legitimately from Linear with the XFF IP, so forcefully inserting this header.
      'x-forwarded-for': linearWebhookIPSource,
    },
    body: sampleEvent,
  },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

describe('Linear Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getAuthIdFromEvent(sampleCtx, sampleEvent)).toBe(sampleEvent.organizationId);
  });

  test('Validate: validateWebhookEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });

  // Linear does not implement initializationChallenge.
  // Therefore only need to validate Linear against no initialization challenge.
  test('Validate initializationChallenge false', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getTokenAuthId', async () => {
    const service: any = new ServiceConnector.Service();
    const scope = nock('https://api.linear.app');
    scope.post('/graphql').reply(200, JSON.stringify({ data: { organization: { id: 'orgId' } } }), {
      'Content-Type': 'application/json',
    });
    // For some reason, if we don't await here, it just refuse to properly respond...
    expect(await service.getTokenAuthId(sampleCtx, '123')).toEqual('orgId');
  });

  test('Validate: getWebhookEventType', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getWebhookEventType(sampleEvent)).toBe(sampleEvent.action);
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, sampleEvent);
    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleEvent,
              entityId: Constants.connectorId,
              eventType: sampleEvent.action,
              webhookAuthId: eventAuthId,
              webhookEventId: `webhook/${Constants.connectorId}/${eventAuthId}`,
            },
          ],
        });
        return true;
      })
      .reply(200);

    await connector.service.handleWebhookEvent(ctx);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(ctx.throw).not.toBeCalled();
  });
});
