export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/microsoft-graph-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  mountUrl:
    '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-microsoft-graph-connector',
};
