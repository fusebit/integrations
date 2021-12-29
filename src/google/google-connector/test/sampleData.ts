export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/google-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-google-connector',
};
