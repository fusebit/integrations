export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  'x-gitlab-token': 'secret',
};

export const sampleConfig = {
  handler: '@fusebit-int/gitlab-connector',
  configuration: {
    scope: 'read_user read_api',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://gitlab.com/oauth/token',
    authorizationUrl: 'https://gitlab.com/oauth/authorize',
    webhookSecret: 'secret',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-gitlab-connector',
};

export const sampleMe = {
  id: 10830299,
  name: 'Fusebit Demo',
  username: 'it_proxy_gitlab',
};
