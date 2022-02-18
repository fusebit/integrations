export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/twitter-connector',
  configuration: {
    scope: 'users.read tweet.read offline.access',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://api.twitter.com/oauth/request_token',
    authorizationUrl: 'https://api.twitter.com/oauth/authorize',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-twitter-connector',
};
