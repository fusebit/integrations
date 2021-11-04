export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  authorization: 'Bearer token',
  'x-hub-signature-256': sampleEvent.headers['x-hub-signature-256'],
  'x-github-event': 'issue_comment',
};

export const sampleConfig = {
  handler: '@fusebit-int/githubapp-connector',
  configuration: {
    scope: '',
    audience: 'api.github.com',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/github-test-connector',
};

export const installations = require('./mock/github-installations.json');
