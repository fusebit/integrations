import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import {
  sampleEvent,
  sampleHeaders,
  sampleConfig,
  slashCommandSampleHeaders,
  slashCommandSampleBody,
} from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

const sampleCtxSlashCommand = {
  req: { headers: { ...slashCommandSampleHeaders }, body: slashCommandSampleBody },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

describe('Slack Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service: any = new ServiceConnector.Service();

    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getAuthIdFromEvent({}, sampleEvent)).toBe(`${sampleEvent.team_id}/${sampleEvent.api_app_id}`);
  });

  test('Validate: validateWebhookEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });

  test('Validate: validateWebhookEvent when content type is form-urlencoded', async () => {
    const service: any = new ServiceConnector.Service();
    expect(await service.validateWebhookEvent(sampleCtxSlashCommand)).toBeTruthy();
  });

  test('Validate: initializationChallenge false', async () => {
    const service: any = new ServiceConnector.Service();
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: initializationChallenge true', async () => {
    const service: any = new ServiceConnector.Service();
    const ctx = JSON.parse(JSON.stringify(sampleCtx));
    ctx.req.body.challenge = 'a challenge';
    expect(await service.initializationChallenge(ctx)).toBeTruthy();
  });

  test('Validate: getTokenAuthId', async () => {
    const service: any = new ServiceConnector.Service();
    const expectedResult = [
      `${sampleEvent.team_id}/${sampleEvent.api_app_id}`,
      `app_id/${sampleEvent.api_app_id}`,
      `team_id/${sampleEvent.team_id}`,
      `user_id/${sampleEvent.event.user}`,
    ];

    expect(
      service.getTokenAuthId(sampleCtx, {
        app_id: sampleEvent.api_app_id,
        team: { id: sampleEvent.team_id },
        authed_user: { id: sampleEvent.event.user },
      })
    ).resolves.toStrictEqual(expectedResult);
  });

  test('Validate: getWebhookEventType', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getWebhookEventType({ type: 'eventType' })).toBe('eventType');
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
