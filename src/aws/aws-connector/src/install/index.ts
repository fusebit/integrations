const schema = {
  type: 'object',
  properties: {
    authorizationUrl: {
      title: 'Override the OAuth2 Authorization URL',
      type: 'string',
    },
    tokenUrl: {
      title: 'Override the OAuth2 Token Request URL',
      type: 'string',
    },
    scope: {
      title: 'Space separated scopes to request from the OAuth server',
      type: 'string',
    },
    clientId: {
      title: 'Client ID',
      type: 'string',
    },
    clientSecret: {
      title: 'Client Secret',
      type: 'string',
    },
    refreshErrorLimit: {
      type: 'integer',
    },
    refreshInitialBackoff: {
      type: 'integer',
    },
    refreshWaitCountLimit: {
      type: 'integer',
    },
    refreshBackoffIncrement: {
      type: 'integer',
    },
    accessTokenExpirationBuffer: {
      type: 'integer',
    },
    defaultEventHandler: {
      title: 'The Integration ID that will act as the default event handler',
      type: 'string',
    },
  },
  required: ['scope', 'clientId', 'clientSecret'],
};
