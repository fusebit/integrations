export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  'x-bamboohr-timestamp': '1658248023',
  'x-bamboohr-signature': '56491dd9c2b352bc5f4fc627159aae20ddff9c8cb19f239a6de6771dc5310bac',
  'company-domain': 'fusebit',
};

export const sampleConfig = {
  handler: '@fusebit-int/bamboohr-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'none',
    authorizationUrl: 'none',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-bamboohr-connector',
};
