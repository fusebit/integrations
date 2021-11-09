import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig, sampleMe } from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent.body },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  throw: jest.fn(),
};

const sampleAccessToken = 'gho_sample_access_token';

describe('GitHub OAuth Connector Webhooks Test Suite', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service: any = new ServiceConnector().service;
    const expectedResponse = [{ data: sampleEvent.body, type: `issue_comment.${sampleEvent.body.action}` }];

    expect(service.getEventsFromPayload(sampleCtx)).toEqual(expectedResponse);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service: any = new ServiceConnector().service;
    expect(service.getAuthIdFromEvent({}, { data: sampleEvent.body })).toBe(sampleEvent.body.sender.id);
  });

  test('Validate: validateWebhookEvent', async () => {
    const service: any = new ServiceConnector().service;
    sampleCtx.state.manager.config.configuration.signingSecret = 'secret';

    expect(service.validateWebhookEvent(sampleCtx)).toBeTruthy();
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: initializationChallenge false', async () => {
    const service: any = new ServiceConnector().service;

    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getTokenAuthId', async () => {
    const service: any = new ServiceConnector().service;
    nock('https://api.github.com').get('/user').reply(200, sampleMe);
    const response = await service.getTokenAuthId(
      { ...sampleCtx, state: { params: { entityId: 'connector' } } },
      { access_token: `${sampleAccessToken}` }
    );
    const expectedUserId = 4001529;
    expect(response).toBe(expectedUserId);
  });

  test('Validate: getWebhookEventType', async () => {
    const service: any = new ServiceConnector().service;

    expect(
      service.getWebhookEventType({
        type: `issue_comment.${sampleEvent.body.action}`,
      })
    ).toBe(`issue_comment.${sampleEvent.body.action}`);
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.state.manager.config.configuration.signingSecret = 'secret';
    ctx.req = sampleCtx.req;

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, { data: sampleEvent.body });
    const eventType = connector.service.getWebhookEventType({
      type: `issue_comment.${sampleEvent.body.action}`,
    });

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: { data: sampleEvent.body, type: eventType },
              entityId: Constants.connectorId,
              eventType: eventType,
              webhookAuthId: `${eventAuthId}`,
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
