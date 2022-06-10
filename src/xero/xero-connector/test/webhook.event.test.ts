import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

const exampleEvent = require('./mock/event.json');

const sampleCtx: any = {
  req: { headers: { ['x-xero-signature']: exampleEvent.requestSignature }, body: exampleEvent.body },
  state: { manager: { config: { configuration: { signingSecret: exampleEvent.signingSecret } } } },
  throw: jest.fn((statusCode, attributes) => Promise.reject({ statusCode, attributes })),
};

describe('Xero Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service = new ServiceConnector.Service();

    expect(service.getEventsFromPayload(sampleCtx)).toEqual(exampleEvent.body.events);
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service = new ServiceConnector.Service();
    expect(service.getAuthIdFromEvent({} as any, exampleEvent.body.events[0])).toBe(
      exampleEvent.body.events[0].tenantId
    );
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: validateWebhookEvent', async () => {
    expect(sampleCtx.throw).not.toBeCalled();
    const service = new ServiceConnector.Service();
    await expect(service.validateWebhookEvent(sampleCtx)).resolves.toBeTruthy();
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: initializationChallenge false', async () => {
    const service = new ServiceConnector.Service();
    expect(await service.initializationChallenge(sampleCtx)).toBeFalsy();
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: getTokenAuthId', async () => {
    const service = new ServiceConnector.Service();
    const expectedResult = [exampleEvent.body.events[0].tenantId];

    const scope = nock('https://api.xero.com')
      .get('/connections')
      .reply(200, [
        {
          id: 'afe07e3d-634d-40cd-a89e-ab75a1a66529',
          authEventId: '802f6ff9-2445-4c1b-b154-477ea95cd050',
          tenantId: 'c2cc9b6e-9458-4c7d-93cc-f02b81b0594f',
          tenantType: 'ORGANISATION',
          tenantName: 'Fusebit Test User',
          createdDateUtc: '2022-06-08T20:25:14.6782650',
          updatedDateUtc: '2022-06-09T17:39:40.0167930',
        },
      ]);

    await expect(service.getTokenAuthId(sampleCtx, { access_token: 'AAAAA' })).resolves.toStrictEqual(expectedResult);

    // Check results.
    expect(scope.isDone()).toBe(true);
    expect(scope.pendingMocks()).toEqual([]);
    expect(sampleCtx.throw).not.toBeCalled();
  });

  test('Validate: getWebhookEventType', async () => {
    const service = new ServiceConnector.Service();
    expect(service.getWebhookEventType(exampleEvent.body.events[0])).toBe('Update');
    expect(sampleCtx.throw).not.toBeCalled();
  });
});
