export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/clearbit-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'nan',
    authorizationUrl: 'nan',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-clearbit-connector',
};
