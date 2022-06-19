import nock from 'nock';
import { ServiceConnector } from '../src';
import { Service } from '../src/Service';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleHeaders, sampleConfig, sampleEvent, sampleData } from './sampleData';
import { Connector } from '@fusebit-int/framework';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  params: { webhookId: sampleData.webhookId },
  throw: jest.fn(),
};

const getData = async (ctx: object, key: string) => {
  return {
    data: sampleData,
  } as Connector.Types.StorageBucketItemParams | undefined;
};
let service: any;
let connector: Connector;

const createMockConnector = () => {
  connector = new ServiceConnector();
  service = connector.service;
  service.utilities.getData = jest.fn(getData);
};

beforeEach(() => {
  createMockConnector();
});

describe('Pipedrive Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(sampleCtx, sampleEvent)).toBe(
      `company_domain/${sampleEvent.meta.host.split('.')[0]}`
    );
  });

  test('Validate: validateWebhookEvent', async () => {
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleEvent)).toBe(sampleEvent.event);
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    ctx.params = { webhookId: sampleData.webhookId };

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
