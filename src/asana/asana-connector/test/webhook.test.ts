import nock from 'nock';
import { ServiceConnector } from '../src';
import { Connector } from '@fusebit-int/framework';
import { sampleEvent, sampleConfig, sampleEventCtx, sampleChallengeCtx, WebhookId } from './sampleData';
import { Constants, getContext } from '../../../framework/test/utilities';

const testMemoryStorage: Record<string, Connector.Types.StorageBucketItem | undefined> = {};
const setData = async (ctx: object, key: string, data: Connector.Types.StorageBucketItemParams) => {
  testMemoryStorage[key] = { ...data, status: 200, storageId: key };
};
const getData = async (ctx: object, key: string) => {
  return testMemoryStorage[key];
};

const applyCtxState = (ctx: Connector.Types.Context): Connector.Types.Context => {
  const defaultCtx = getContext();
  const clonedCtx = JSON.parse(JSON.stringify(ctx));
  return {
    ...defaultCtx,
    ...clonedCtx,
    state: { ...defaultCtx.state, manager: { config: { configuration: sampleConfig.configuration } } },
    res: {
      setHeader: jest.fn(),
    },
  };
};

// Global variables to be used per-test, overwritten in `beforeEach`
let SampleChallengeCtx: Connector.Types.Context;
let SampleEventCtx: Connector.Types.Context;
let webhookId: string;
let service: any;
let connector: any;

const createMockConnector = () => {
  connector = new ServiceConnector();
  service = connector.service;
  service.utilities.getData = jest.fn(getData);
  service.utilities.setData = jest.fn(setData);
};

const testRegisterWebhook = async () => {
  // Register Webhook only uses ctx for storage, which is mocked
  webhookId = (await service.registerWebhook({})).webhookId;
  const expectedChallengeStorageId = service.createWebhookChallengeStorageKey(webhookId);
  expect(service.utilities.setData).toHaveBeenCalledWith(expect.anything(), expectedChallengeStorageId, {
    expires: expect.anything(),
    data: {},
  });

  Object.assign(SampleChallengeCtx, { params: { webhookId } });
  Object.assign(SampleEventCtx, { params: { webhookId } });
};

const testInitializationChallenge = async () => {
  const isChallenge = await service.initializationChallenge(SampleChallengeCtx);
  expect(isChallenge).toBeTruthy();
  expect(SampleChallengeCtx.res.setHeader).toHaveBeenCalled();
  const expectedSecretStorageId = service.createWebhookSecretStorageKey(webhookId);
  const expectedChallengeStorageId = service.createWebhookChallengeStorageKey(webhookId);
  expect(service.utilities.getData).toHaveBeenCalledWith(expect.anything(), expectedChallengeStorageId);
  expect(service.utilities.setData).toHaveBeenCalledWith(expect.anything(), expectedSecretStorageId, {
    data: { secret: expect.any(String) },
  });
};

const testValidation = async () => {
  Object.assign(SampleEventCtx, { params: { webhookId } });
  const isEventChallenge = await service.initializationChallenge(SampleEventCtx);
  expect(isEventChallenge).toBeFalsy();
  const validationPassed = await service.validateWebhookEvent(SampleEventCtx);
  expect(validationPassed).toBeTruthy();
};

describe('Asana Webhook Events', () => {
  beforeEach(() => {
    SampleChallengeCtx = applyCtxState(sampleChallengeCtx as unknown as Connector.Types.Context);
    SampleEventCtx = applyCtxState(sampleEventCtx as unknown as Connector.Types.Context);
    createMockConnector();
  });
  test('Validate: getEventsFromPayload', async () => {
    const events = service.getEventsFromPayload(SampleEventCtx);
    expect(events[0]).toMatchObject(sampleEvent);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const events = service.getEventsFromPayload(SampleEventCtx);
    expect(service.getAuthIdFromEvent(SampleEventCtx, events[0])).toBe(WebhookId);
  });

  test('Validate: initializationChallenge true', async () => {
    await testRegisterWebhook();
    await testInitializationChallenge();
  });

  test('Validate: initializationChallenge false', async () => {
    await testRegisterWebhook();
    const isChallenge = await service.initializationChallenge(SampleEventCtx);
    expect(isChallenge).toBeFalsy();
    expect(SampleEventCtx.res.setHeader).not.toHaveBeenCalled();
  });

  test('Validate: validateWebhookEvent requires challenge', async () => {
    await testRegisterWebhook();
    await expect(testValidation()).rejects.toThrow();
    await expect(service.validateWebhookEvent(SampleEventCtx)).rejects.toThrow();
  });

  test('Validate: initializationChallenge requires registerWebhook', async () => {
    webhookId = 'unknown_webhook_id';
    await expect(testInitializationChallenge()).rejects.toThrow();
    expect(SampleChallengeCtx.res.setHeader).not.toHaveBeenCalled();
  });

  test('Validate: getTokenAuthId', async () => {
    await expect(service.getTokenAuthId({}, {})).resolves.toBeUndefined();
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType({ action: 'eventType' })).toBe('eventType');
  });

  test('Validate: validateWebhookEvent', async () => {
    await testRegisterWebhook();
    await testInitializationChallenge();
    await testValidation();
  });

  test('Validate: Event to Fanout', async () => {
    await testRegisterWebhook();
    await testInitializationChallenge();
    await testValidation();

    // Create mocked endpoints for each event.
    const scope = nock(SampleEventCtx.state.params.baseUrl);

    const getWebhookData = () => {
      const events = service.getEventsFromPayload(SampleEventCtx);
      expect(Array.isArray(events)).toBeTruthy();
      const eventAuthId = service.getAuthIdFromEvent(SampleEventCtx, events[0]);
      const webhookTag = `webhook/${Constants.connectorId}/${eventAuthId}`;
      return { webhookTag, events, eventAuthId };
    };
    scope
      .post('/fan_out/event/webhook', (body) => {
        const { webhookTag, events, eventAuthId } = getWebhookData();
        expect(body).toEqual({
          payload: events.map((event: Event) => ({
            data: event,
            entityId: Constants.connectorId,
            eventType: sampleEvent.action,
            webhookAuthId: eventAuthId,
            webhookEventId: webhookTag,
          })),
        });
        return true;
      })
      .query((actual) => {
        const { webhookTag } = getWebhookData();
        const expected = { tag: webhookTag };
        expect(actual).toEqual(expected);
        return true;
      })
      .reply(200);

    await connector.service.handleWebhookEvent(SampleEventCtx);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(SampleEventCtx.throw).not.toBeCalled();
  });
});
