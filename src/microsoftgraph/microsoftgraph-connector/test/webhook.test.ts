import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleHeaders, sampleConfig, sampleEvent, sampleEncryptedEvent, decryptedPayload } from './sampleData';
import { Connector } from '@fusebit-int/framework';
import { getData, setData } from '../../../../test/mocks/storage';

const sampleAuthIdEvent = sampleEvent.value[0];

jest.mock('../src/tokenValidator');

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
  headers: { ...sampleHeaders },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  query: {},
  throw: jest.fn(),
};

beforeEach(() => {
  createMockConnector();
});

describe('Microsoft Graph Webhook Events', () => {
  test('Validate: getEventsFromPayload for Subscribtion creation (Healthcheck)', async () => {
    expect(
      service.getEventsFromPayload({
        ...sampleCtx,
        query: {
          validationToken: 'NzNjZjZhMTctODRhMC00ZjBmLTg5NjEtZDVmMWVjNzcwODcw',
        },
      })
    ).toEqual([]);
  });

  test('Validate: getEventsFromPayload for Subscribtion creation without resource data', async () => {
    expect(
      service.getEventsFromPayload({
        ...sampleCtx,
      })
    ).toEqual([sampleEvent.value[0]]);
  });

  test('Validate: getEventsFromPayload for Subscribtion creation with encrypted resource data', async () => {
    const expectedEvent = { ...sampleEncryptedEvent.value[0] };
    delete expectedEvent.encryptedContent;

    expect(
      service.getEventsFromPayload({
        ...sampleCtx,
        req: { body: sampleEncryptedEvent },
      })
    ).toEqual([{ ...expectedEvent, decryptedPayload }]);
  });

  test('Validate: getEventsFromPayload for Subscribtion creation shouldn return encrypted payload if decryption fails', async () => {
    const expectedEvent = { ...sampleEncryptedEvent.value[0] };
    delete expectedEvent.encryptedContent;
    const events = service.getEventsFromPayload({
      ...sampleCtx,
      state: {
        manager: {
          config: {
            configuration: {
              ...sampleConfig.configuration,
              privateKey: 'this key decrypts whatsapp but not ms graph ;)',
            },
          },
        },
      },
      req: { body: sampleEncryptedEvent },
    });
    expect(events).toEqual([{ ...expectedEvent }]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(sampleCtx, sampleAuthIdEvent)).toBe(`tenant/${sampleAuthIdEvent.tenantId}`);
  });

  test('Validate: validateWebhookEvent for health check event', async () => {
    expect(
      await service.validateWebhookEvent({
        ...sampleCtx,
        query: {
          validationToken: 'NzNjZjZhMTctODRhMC00ZjBmLTg5NjEtZDVmMWVjNzcwODcw',
        },
      })
    ).toBeTruthy();
  });

  test('Validate: validateWebhookEvent for subscription event', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        clientState: sampleEvent.value[0].clientState,
      },
    });
    expect(
      await service.validateWebhookEvent({
        ...sampleCtx,
      })
    ).toBeTruthy();
  });

  test('Validate: validateWebhookEvent for subscription event with validation tokens', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        clientState: sampleEvent.value[0].clientState,
      },
    });
    expect(
      await service.validateWebhookEvent({
        ...sampleCtx,
        req: { body: { ...sampleEvent, validationTokens: ['JWT Token'] } },
      })
    ).toBeTruthy();
  });

  test('Validate: validateWebhookEvent for subscription event with failed JWT validation', async () => {
    const event = { ...sampleEvent };
    delete event.value[0].tenantId;
    service.utilities.getData.mockReturnValue({
      data: {
        clientState: sampleEvent.value[0].clientState,
      },
    });

    expect(
      await service.validateWebhookEvent({
        ...sampleCtx,
        req: { body: { ...event, validationTokens: ['JWT Token'] } },
      })
    ).toBeFalsy();
  });

  test('Validate: validateWebhookEvent fails with an invalid client state', async () => {
    service.utilities.getData.mockReturnValue({
      data: {
        clientState: 'some invalid stored state',
      },
    });

    expect(
      await service.validateWebhookEvent({
        ...sampleCtx,
      })
    ).toBeFalsy();
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleEvent.value[0])).toBe('updated');
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    ctx.query = {};
    service.utilities.getData.mockReturnValue({
      data: {
        clientState: sampleEvent.value[0].clientState,
      },
    });

    const connector: any = new ServiceConnector();
    const eventAuthId = connector.service.getAuthIdFromEvent(ctx, sampleAuthIdEvent);
    const eventType = connector.service.getWebhookEventType(sampleAuthIdEvent);

    // Create mocked endpoints for each event.
    const scope = nock(ctx.state.params.baseUrl);
    scope
      .post(`/fan_out/event/webhook?tag=webhook/${Constants.connectorId}/${eventAuthId}`, (body) => {
        expect(body).toEqual({
          payload: [
            {
              data: sampleAuthIdEvent,
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
