---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/test/sampleData.ts
---
export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/<%= name.toLowerCase() %>-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: '<%= connector.tokenUrl %>',
    authorizationUrl: '<%= connector.authorizationUrl %>',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-<%= name.toLowerCase() %>-connector',
};
