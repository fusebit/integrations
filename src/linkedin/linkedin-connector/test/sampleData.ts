export const sampleHeaders = {};

export const sampleConfig = {
  handler: '@fusebit-int/linkedin-connector',
  configuration: {
    scope: 'r_liteprofile r_emailaddress',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-linkedin-connector',
};
