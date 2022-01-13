export const sampleHeaders = { 'intuit-signature': '0QtxVvjLouZmvN4+PeEvItp71hZ3C5uv1tewshSV7Kk=' };

export const sampleEvent = {
  eventNotifications: [
    {
      realmId: 'AAAAAAAAAAAAAAAAAAA',
      dataChangeEvent: {
        entities: [{ name: 'Purchase', id: '147', operation: 'Delete', lastUpdated: '2022-01-13T01:13:43.148Z' }],
      },
    },
  ],
};

export const sampleConfig = {
  handler: '@fusebit-int/quickbooks-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    verifierToken: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/test-quickbooks-connector',
};
