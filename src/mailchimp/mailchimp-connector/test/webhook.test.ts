import nock from 'nock';
import { ServiceConnector } from '../src';
import { Service } from '../src/Service';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleHeaders, sampleConfig, sampleEvent } from './sampleData';
import { Connector } from '@fusebit-int/framework';

const testMemoryStorage: Record<string, Connector.Types.StorageBucketItem | undefined> = {};

const setData = async (ctx: object, key: string, data: Connector.Types.StorageBucketItemParams) => {
  testMemoryStorage[key] = { ...data, status: 200, storageId: key };
};
const getData = async (ctx: object, key: string) => {
  return testMemoryStorage[key];
};

let service: any;
let connector: Connector;

const createMockConnector = () => {
  connector = new ServiceConnector();
  service = connector.service;
  service.utilities.getData = jest.fn(getData);
  service.utilities.setData = jest.fn(setData);
};

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  params: { webhookId: 'mango' },
  query: {
    secret: 'kiwi',
  },
  throw: jest.fn(),
};

beforeEach(() => {
  createMockConnector();
});

describe('Mailchimp Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(sampleCtx, sampleEvent)).toBe(sampleEvent.webhookId);
  });

  test('Validate: validateWebhookEvent', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        webhookId: sampleEvent.webhookId,
        secret: 'kiwi',
      },
    });

    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
    expect(service.utilities.getData).toHaveBeenCalledWith(expect.anything(), `webhook/${sampleEvent.webhookId}`);
  });

  test('Validate: validateWebhookEvent fails with an invalid secret', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        webhookId: sampleEvent.webhookId,
        secret: 'invalid',
      },
    });

    expect(await service.validateWebhookEvent(sampleCtx)).toBeFalsy();
  });

  test('Validate: validateWebhookEvent without a secret', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        webhookId: sampleEvent.webhookId,
      },
    });
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleEvent)).toBe(sampleEvent.type);
  });

  test.only('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    ctx.params = {
      webhookId: 'mango',
    };

    ctx.query = {
      secret: 'kiwi',
    };

    const connector: any = new ServiceConnector();
    connector.service.utilities.getData.mockReturnValue({
      data: {
        webhookId: sampleEvent.webhookId,
        secret: 'kiwi',
      },
    });
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
