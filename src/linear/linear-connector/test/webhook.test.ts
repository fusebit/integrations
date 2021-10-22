import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

import { sampleEvent, sampleConfig } from './sampleData';

const linearWebhookIPSource = '35.231.147.226';

const sampleCtx: any = {
  req: {
    headers: {
      // Linear utilizes IP based whitelisting. there isn't a easy way to get a request
      // legitimately from Linear with the XFF IP, so forcefully inserting this header.
      'X-forwarded-for': linearWebhookIPSource,
    },
    body: sampleEvent,
  },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
};

describe('Linear Webhook Events', () => {
  test('Validate getEventsFromPayload', async () => {
    const service: any = new ServiceConnector.Service();
    expect(service.getEventsFromPayload(sampleCtx)).toEqual(sampleEvent);
  });
});
