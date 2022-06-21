export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  authorization: 'Basic c3RyYXdiZXJyeTptYW5nbw==',
};

export const sampleConfig = {
  handler: '@fusebit-int/pipedrive-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    authorizationUrl: 'https://oauth.pipedrive.com/oauth/authorize',
  },
};

export const sampleData = {
  webhookId: 'strawberry',
  secret: 'mango',
};
