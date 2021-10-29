import nock from 'nock';
import Provider from '../src';
import { getContext } from '../../../framework/test/utilities';
const webhooks = {
  create: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
  deleteById: jest.fn(),
};
jest.mock('asana', () => ({
  Client: {
    create: jest.fn(() => ({
      useAccessToken: jest.fn(() => ({ webhooks })),
      webhooks,
    })),
  },
}));
import AsanaClient from 'asana';
const asanaClient = AsanaClient.Client.create();

const installId = 'installId';
const cfg = {
  name: 'Test',
  path: 'test',
  provider: 'test-sdk',
  entityId: 'e-id',
  entityType: 'some-integration',
};

const ctx = getContext();
// Utility function.  Constructs a regex to match a url path, given an array of path segments.
// Parameters can be handled by undefined inputs
const regexPathBuilder = (pathSegments: (string | undefined)[]) => {
  const segments = [...pathSegments];
  return new RegExp(
    segments
      .map((seg, index) => {
        if (!seg) {
          return '.+?(?=\\/)';
        }
        return seg;
      })
      .join('/')
  );
};

const tagUrl = regexPathBuilder(['.*', 'v2', 'account', , 'subscription', , 'integration', , 'install', , 'tag', '.*']);
const createWebhookUrl = regexPathBuilder([
  '.*',
  'v2',
  'account',
  ,
  'subscription',
  ,
  'connector',
  ,
  'api',
  'fusebit_webhook_create',
  '.*',
]);
const eventWebhookUrl = regexPathBuilder([
  '.*',
  'v2',
  'account',
  ,
  'subscription',
  ,
  'connector',
  ,
  'api',
  'fusebit_webhook_event',
  '.*',
]);
const tokenUrl = regexPathBuilder(['.*', 'v2', 'account', , 'subscription', , 'connector', , 'api', , 'token']);

describe('Asana Webhook Provider', () => {
  beforeEach(() => {
    const scope = nock(ctx.state.params.endpoint);
    scope.put(tagUrl).reply(200);
    scope.post(createWebhookUrl).reply(200);
    scope.get(tokenUrl).reply(200, { body: { fake: 'token' } });
  });
  test('Validate: create webhook injection', async () => {
    const provider = new Provider(cfg);
    const webhookClient = await provider.instantiateWebhook(getContext(), 'Test', installId);

    const resourceId = 'resource_id';
    const data = { abc: 123 };
    const dispatchOptions = { def: 456 };
    await webhookClient.create(resourceId, data, dispatchOptions);
    expect(asanaClient.webhooks.create).toHaveBeenCalledWith(
      resourceId,
      expect.stringMatching(eventWebhookUrl),
      data,
      dispatchOptions
    );
  });

  test('Validate: get webhook', async () => {
    const provider = new Provider(cfg);
    const webhookClient = await provider.instantiateWebhook(getContext(), 'Test', installId);

    const webhookId = 'webhook_id';
    const params = { abc: 123 };
    const dispatchOptions = { def: 456 };
    await webhookClient.get(webhookId, params, dispatchOptions);
    expect(asanaClient.webhooks.getById).toHaveBeenCalledWith(webhookId, params, dispatchOptions);
  });

  test('Validate: get all webhooks', async () => {
    const provider = new Provider(cfg);
    const webhookClient = await provider.instantiateWebhook(getContext(), 'Test', installId);

    const webhookId = 'webhook_id';
    const params = { abc: 123 };
    const dispatchOptions = { def: 456 };
    await webhookClient.getAll(webhookId, params, dispatchOptions);
    expect(asanaClient.webhooks.getAll).toHaveBeenCalledWith(webhookId, params, dispatchOptions);
  });

  test('Validate: delete webhook', async () => {
    const provider = new Provider(cfg);
    const webhookClient = await provider.instantiateWebhook(getContext(), 'Test', installId);

    const webhookId = 'webhook_id';
    const dispatchOptions = { def: 456 };
    await webhookClient.delete(webhookId, dispatchOptions);
    expect(asanaClient.webhooks.deleteById).toHaveBeenCalledWith(webhookId, dispatchOptions);
  });
});
