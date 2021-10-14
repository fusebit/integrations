import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';

const sampleCtx = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

describe('Slack Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service = new ServiceConnector.Service();

    expect(service.getEventsFromPayload(sampleCtx as any)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service = new ServiceConnector.Service();

    expect(service.getAuthIdFromEvent(sampleEvent)).toBe(sampleEvent.authorizations[0].user_id);
  });

  test('Validate: validateWebhookEvent', async () => {
    const service = new ServiceConnector.Service();
    expect(service.validateWebhookEvent(sampleCtx as any)).toBeTruthy();
  });

  test('Validate: initializationChallenge false', async () => {
    const service = new ServiceConnector.Service();
    expect(service.initializationChallenge(sampleCtx as any)).toBeFalsy();
  });

  test('Validate: initializationChallenge true', async () => {
    const service = new ServiceConnector.Service();
    const ctx = JSON.parse(JSON.stringify(sampleCtx));
    (ctx.req.body as any).challenge = 'a challenge';
    expect(service.initializationChallenge(ctx as any)).toBeTruthy();
  });

  test('Validate: getTokenAuthId', async () => {
    const service = new ServiceConnector.Service();
    expect(service.getTokenAuthId(sampleCtx as any, { bot_user_id: 'userid' })).resolves.toBe('userid');
  });

  test('Validate: getWebhookEventType', async () => {
    const service = new ServiceConnector.Service();
    expect(service.getWebhookEventType({ type: 'eventType' })).toBe('eventType');
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req as any;

    const connector = new ServiceConnector();
    const eventAuthId = (connector.service as any).getAuthIdFromEvent(sampleEvent);
    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleEvent,
              entityId: Constants.connectorId,
              eventType: sampleEvent.type,
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
