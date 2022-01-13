import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleHeaders, sampleConfig } from './sampleData';

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

describe('Webhook Events', () => {
  test('Validate: getEventsFromPayload', async () => {
    const service: any = new ServiceConnector.Service();

    expect(service.getEventsFromPayload(sampleCtx)).toEqual(sampleEvent.eventNotifications);
  });

  test('Validate: getAuthIdFromEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getAuthIdFromEvent({}, sampleEvent.eventNotifications[0])).toBe('AAAAAAAAAAAAAAAAAAA');
  });

  test('Validate: validateWebhookEvent', async () => {
    const service: any = new ServiceConnector.Service();
    expect(await service.validateWebhookEvent(sampleCtx)).toBeTruthy();
  });
});
