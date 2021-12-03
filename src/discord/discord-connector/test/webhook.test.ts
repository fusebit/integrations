import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig, guild, publicKey } from './sampleData';

const createContext = (headers: any, body: any): any => ({
  req: { headers: { ...headers }, body: body },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  throw: jest.fn(),
});

const pingContext = createContext(sampleHeaders.ping_event, sampleEvent.ping_event.body);
const slashCommandContext = createContext(sampleHeaders.slash_command, sampleEvent.slash_command.body);
const sampleAccessToken = 'discord_sample_access_token';

let service: any;
beforeEach(() => {
  service = new ServiceConnector().service;
});

describe('Discord Connector Webhooks Test Suite', () => {
  test('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(pingContext)).toEqual([sampleEvent.ping_event.body]);
    expect(service.getEventsFromPayload(slashCommandContext)).toEqual([sampleEvent.slash_command.body]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(pingContext, guild)).toBe(guild.guild_id);
    expect(service.getAuthIdFromEvent(slashCommandContext, guild)).toBe(guild.guild_id);
  });

  test('Validate: validateWebhookEvent', async () => {
    pingContext.state.manager.config.configuration.applicationPublicKey = publicKey;
    expect(await service.validateWebhookEvent(pingContext)).toBeTruthy();
    expect(pingContext.throw).not.toBeCalled();
  });

  test('Validate: initializationChallenge true for ping event', async () => {
    pingContext.req.body = {
      type: 1,
    };
    expect(await service.initializationChallenge(pingContext)).toBeTruthy();
  });

  test('Validate: initializationChallenge false for non ping event', async () => {
    slashCommandContext.req.body = {
      type: 4,
    };
    expect(await service.initializationChallenge(slashCommandContext)).toBeFalsy();
  });

  test('Validate: getTokenAuthId', async () => {
    const response = await service.getTokenAuthId(
      { ...pingContext, state: { params: { entityId: 'connector' } } },
      { access_token: `${sampleAccessToken}`, guild: { id: guild.guild_id } }
    );
    expect(response).toStrictEqual(guild.guild_id);
  });

  test('Validate: getWebhookEventType', async () => {
    const event = {
      type: '4',
    };
    expect(service.getWebhookEventType(event)).toBe(event.type);
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...slashCommandContext.state };
    ctx.state.manager.config.configuration.applicationPublicKey = publicKey;
    ctx.req = slashCommandContext.req;
    ctx.req.body = sampleEvent.slash_command.body;

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, guild);
    const eventType = connector.service.getWebhookEventType({
      type: '2',
    });

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleEvent.slash_command.body,
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
