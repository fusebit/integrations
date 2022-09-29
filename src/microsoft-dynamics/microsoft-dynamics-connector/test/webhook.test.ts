import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';
import { sampleHeaders, sampleConfig, sampleEvent } from './sampleData';
import { Connector } from '@fusebit-int/framework';

let service: any;
let connector: Connector;
const encodedOrganizationId = 'NzNjZjZhMTctODRhMC00ZjBmLTg5NjEtZDVmMWVjNzcwODcw';

const createMockConnector = () => {
  connector = new ServiceConnector();
  service = connector.service;
};

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  headers: { ...sampleHeaders },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  query: {
    secret: encodedOrganizationId,
  },
  throw: jest.fn(),
};

beforeEach(() => {
  createMockConnector();
});

describe('Microsoft Dynamics Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    expect(service.getEventsFromPayload(sampleCtx)).toEqual([sampleEvent]);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    expect(service.getAuthIdFromEvent(sampleCtx, sampleEvent)).toBe(`organization/${sampleEvent.OrganizationId}`);
  });

  test('Validate: validateWebhookEvent', async () => {
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });

  test('Validate: validateWebhookEvent fails with an invalid secret', async () => {
    const ctx = { ...sampleCtx };
    delete ctx.query.secret;
    expect(await service.validateWebhookEvent(ctx)).toBeFalsy();
  });

  test('Validate: validateWebhookEvent fails with a secret from a different organization', async () => {
    const ctx = { ...sampleCtx, query: { secret: 'yet-another-organization' } };
    expect(await service.validateWebhookEvent(ctx)).toBeFalsy();
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
  });

  test('Validate: getWebhookEventType', async () => {
    expect(service.getWebhookEventType(sampleEvent)).toBe('incident:create');
  });

  test('Validate: Event to Fanout', async () => {
    const ctx = getContext();
    ctx.state = { ...ctx.state, ...sampleCtx.state };
    ctx.req = sampleCtx.req;
    ctx.query = {
      secret: encodedOrganizationId,
    };

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
