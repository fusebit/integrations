export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  'x-pagerduty-signature': 'v1=4b2af2fff388da73bf33d8d7328536f2c1bd5f4e7babc2ddb9e5cd828ef0321e',
};

export const sampleConfig = {
  handler: '@fusebit-int/mailchimp-connector',
  configuration: {
    scope: '',
    clientId: 'id',
    clientSecret: 'secret',
    tokenUrl: 'https://app.pagerduty.com/oauth/token',
    authorizationUrl: 'https://app.pagerduty.com/oauth/authorize',
  },
};

export const sampleData = {
  signingSecret: '2X5Vy+fPXFI7HCV1WOQOP50ZFUhY/B8j0JrDCfznoVBm4dqLUFCZ0kSfaV3kOPYX',
};
