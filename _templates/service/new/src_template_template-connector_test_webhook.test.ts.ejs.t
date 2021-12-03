---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/test/webhook.test.ts
---
import nock from 'nock';
import { ServiceConnector } from '../src';
import { Service } from '../src/Service';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  throw: jest.fn(),
};

const sampleAccessToken = 'sample_access_token';

let service: Service;
beforeEach(() => {
  service = new ServiceConnector().service;
});

describe('<%= h.capitalize(name) %> Webhook Events', () => {
  test.todo('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test.todo('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent({}, sampleEvent)).toBe(sampleEvent.user.accountId);
  });

  test.todo('Validate: validateWebhookEvent', async () => {
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test.todo('Validate: initializationChallenge false', async () => {
    expect(service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test.todo('Validate: getTokenAuthId', async () => {
    const scope = nock('https://api.<%= name.toLowerCase() %>.com');
    scope.matchHeader('authorization', `Bearer ${sampleAccessToken}`).get('/me').reply(200, sampleMe);

    expect(service.getTokenAuthId(sampleCtx, { access_token: `${sampleAccessToken}` })).resolves.toBe(
      '616e378a5800630069f43cb6'
    );
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleEvent)).toBe(sampleEvent.webhookEvent);
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, sampleEvent);
    const eventType = connector.service.getWebhookEventType(sampleEvent);

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleEvent,
              entityId: Constants.connectorId,
              eventType: eventType,
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
