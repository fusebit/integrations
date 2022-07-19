import nock from 'nock';
import { Connector } from '@fusebit-int/framework';

import { ServiceConnector } from '../src';
import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  path: '/webhook/event/303098f2-780c-4951-9dc8-81a272a969ff/action/onEmployeeChange',
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  throw: jest.fn(),
};

const companyDomain = 'fusebit.bamboohr.com';
const webhookId = '303098f2-780c-4951-9dc8-81a272a969ff';
const privateKey = '123b929362d51613054f71e5e5d4bf2c';
const sampleBody = { ...sampleEvent, companyDomain, type: 'onEmployeeChange' };

const testMemoryStorage: Record<string, Connector.Types.StorageBucketItem | undefined> = {};

const setData = async (ctx: object, key: string, data: Connector.Types.StorageBucketItemParams) => {
  testMemoryStorage[key] = { ...data, status: 200, storageId: key };
};
const getData = async (ctx: object, key: string) => {
  return testMemoryStorage[key];
};

let service: any;
let connector: Connector;

beforeEach(() => {
  connector = new ServiceConnector();
  service = connector.service;
  service.utilities.getData = jest.fn(getData);
  service.utilities.setData = jest.fn(setData);
});

describe('BambooHR Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleBody]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(sampleCtx, sampleEvent)).toBe(`company_domain/${sampleEvent.companyDomain}`);
  });

  test('Validate: validateWebhookEvent', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        webhookId,
        privateKey,
      },
    });

    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
    expect(service.utilities.getData).toHaveBeenCalledWith(expect.anything(), `webhook/${webhookId}`);
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getTokenAuthId', async () => {
    expect(await service.getTokenAuthId(sampleCtx, { companyDomain })).toStrictEqual([
      `company_domain/${companyDomain}`,
    ]);
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleBody)).toStrictEqual('onEmployeeChange');
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    ctx.path = sampleCtx.path;

    const connector: any = new ServiceConnector();
    connector.service.utilities.getData.mockReturnValue({
      data: {
        webhookId,
        privateKey,
      },
    });
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, sampleBody);
    const eventType = connector.service.getWebhookEventType(sampleBody);

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleBody,
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
