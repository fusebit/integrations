import nock from 'nock';
import { ServiceConnector } from '../src';

import { getContext } from '../../../framework/test/utilities';
import { Constants } from '../../../framework/test/utilities';

const sampleMe = {};
const sampleEvent = {
  user: {
    accountId: null,
  },
  webhookEvent: {},
};
const sampleHeaders = {};
const sampleConfig = {
  configuration: {},
};

const sampleCtx: any = {
  req: { headers: { ...sampleHeaders }, body: sampleEvent },
  state: { manager: { config: { configuration: sampleConfig.configuration } } },
  throw: jest.fn(),
};

const sampleAccessToken = 'sample_access_token';

describe('Microsoft Teams Webhook Events', () => {
  test.todo('Validate: getEventsFromPayload');

  test.todo('Validate: getAuthIdFromEvent');

  test.todo('Validate: validateWebhookEvent');

  test.todo('Validate: initializationChallenge false');

  test.todo('Validate: getTokenAuthId');

  test.todo('Validate: getWebhookEventType');

  test.todo('Validate: Event to Fanout');
});
