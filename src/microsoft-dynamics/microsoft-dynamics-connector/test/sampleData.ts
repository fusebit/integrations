export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  'x-ms-dynamics-entity-name': 'incident',
  'x-ms-dynamics-organization': 'org6eadd181.crm.dynamics.com',
  'x-ms-dynamics-request-name': 'Create',
};

export const sampleConfig = {
  handler: '@fusebit-int/microsoft-dynamics-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/token',
    authorizationUrl: 'https://login.microsoftonline.com/{{tenant}}/oauth2/v2.0/authorize',
    tenant: 'organization',
  },
  mountUrl:
    '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-microsoft-dynamics-connector',
};
