import nock from 'nock';
import { ServiceConnector } from '../src';
import { Constants, getContext } from '../../../framework/test/utilities';

import { sampleEvent, sampleConfig, sampleEventCtx, sampleChallengeCtx, WebhookId } from './sampleData';
import { FusebitContext } from '@fusebit-int/framework/libc/router';

type FusebitStorageContext = {
  setWebhookStorageData: (data: WebhookStorageData) => Promise<void>;
  getWebhookStorageData: () => Promise<WebhookStorageData>;
};

type TestFusebitContext = Omit<FusebitContext, 'fusebit'> & { fusebit: FusebitStorageContext };
type PartialTestFusebitContext = Partial<TestFusebitContext> & { params: { webhookId: string } };

const applyCtxState = (ctx: PartialTestFusebitContext, storage: Record<string, object>): TestFusebitContext => {
  const setWebhookStorageData = async (data: WebhookStorageData): Promise<void> => {
    storage[ctx.params.webhookId] = data;
  };
  const getWebhookStorageData = async (): Promise<WebhookStorageData> => storage[ctx.params.webhookId];
  const defaultCtx = getContext();
  const clonedCtx = JSON.parse(JSON.stringify(ctx));
  return {
    ...defaultCtx,
    ...clonedCtx,
    state: { ...defaultCtx.state, manager: { config: { configuration: sampleConfig.configuration } } },
    fusebit: {
      getWebhookStorageData,
      setWebhookStorageData,
    },
    res: {
      setHeader: jest.fn(),
    },
  };
};

const createContexts = () => {
  const Storage = {};
  return {
    SampleChallengeCtx: applyCtxState(sampleChallengeCtx, Storage),
    SampleEventCtx: applyCtxState(sampleEventCtx, Storage),
  };
};

describe('Asana Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const { SampleEventCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    const events = service.getEventsFromPayload(SampleEventCtx);
    expect(events[0]).toMatchObject(sampleEvent);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const { SampleEventCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    const events = service.getEventsFromPayload(SampleEventCtx);
    expect(service.getAuthIdFromEvent(SampleEventCtx, events[0])).toBe(WebhookId);
  });

  test('Validate: validateWebhookEvent', async () => {
    const { SampleEventCtx, SampleChallengeCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    await SampleChallengeCtx.fusebit.setWebhookStorageData({ expiry: Date.now() + 500 });
    await service.initializationChallenge(SampleChallengeCtx);
    expect(await service.validateWebhookEvent(SampleEventCtx)).toBeTruthy();
  });

  test('Validate: validateWebhookEvent requires challenge', async () => {
    const { SampleEventCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    await expect(service.validateWebhookEvent(SampleEventCtx)).rejects.toThrow();
  });

  test('Validate: initializationChallenge false', async () => {
    const { SampleEventCtx, SampleChallengeCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    expect(await service.initializationChallenge(SampleEventCtx)).toBeFalsy();
    expect(SampleChallengeCtx.res.setHeader).not.toHaveBeenCalled();
  });

  test('Validate: initializationChallenge true', async () => {
    const { SampleChallengeCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    await SampleChallengeCtx.fusebit.setWebhookStorageData({ expiry: Date.now() + 500 });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await service.initializationChallenge(SampleChallengeCtx)).toBeTruthy();
    expect(SampleChallengeCtx.res.setHeader).toHaveBeenCalled();
  });

  test('Validate: initializationChallenge requires CreatedExpiry', async () => {
    const { SampleChallengeCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    await expect(service.initializationChallenge(SampleChallengeCtx)).rejects.toThrow();
    expect(SampleChallengeCtx.res.setHeader).not.toHaveBeenCalled();
  });

  test('Validate: getTokenAuthId', async () => {
    const { SampleEventCtx } = createContexts();
    const service: any = new ServiceConnector.Service();
    expect(service.getTokenAuthId(SampleEventCtx, { bot_user_id: 'userid' })).resolves.toBeUndefined();
  });

  test('Validate: getWebhookEventType', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getWebhookEventType({ action: 'eventType' })).toBe('eventType');
  });

  test('Validate: Event to Fanout', async () => {
    const { SampleEventCtx, SampleChallengeCtx } = createContexts();
    const connector: any = new ServiceConnector();
    await SampleChallengeCtx.fusebit.setWebhookStorageData({ expiry: Date.now() + 10 * 1000 });
    await connector.service.initializationChallenge(SampleChallengeCtx);
    const mockCtx = JSON.parse(JSON.stringify(SampleEventCtx));
    const events = connector.service.getEventsFromPayload(mockCtx);
    const eventAuthId = connector.service.getAuthIdFromEvent(mockCtx, events[0]);
    // Create mocked endpoints for each event.
    const scope = nock(SampleEventCtx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: events.map((event: any) => ({
            data: event,
            entityId: Constants.connectorId,
            eventType: sampleEvent.action,
            webhookAuthId: eventAuthId,
            webhookEventId: `webhook/${Constants.connectorId}/${eventAuthId}`,
          })),
        });
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
