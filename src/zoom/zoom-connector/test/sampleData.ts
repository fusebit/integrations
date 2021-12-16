export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  authorization: '234',
};

export const sampleConfig = {
  handler: '@fusebit-int/zoom-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://zoom.us/oauth/token',
    authorizationUrl: 'https://zoom.us/oauth/authorize',
    webhookSecret: '234',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-zoom-connector',
};
