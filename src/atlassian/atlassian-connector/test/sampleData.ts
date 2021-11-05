import * as fs from 'fs';
import path from 'path';

export const sampleEvent = require('./mock/webhook-event.json');

export const sampleHeaders = {
  authorization: `Bearer ${fs.readFileSync(path.join(__dirname, '/mock/sample-raw-jwt.txt'), 'utf8')}`,
};

export const sampleConfig = {
  handler: '@fusebit-int/atlassian-connector',
  configuration: {
    scope: 'read:jira-user read:jira-work manage:jira-webhook read:me read:confluence-content.summary offline_access',
    audience: 'api.atlassian.com',
    clientId: '43d5a5023061fc6de71101d86e28c83a',
    clientSecret: '5a76dcf939f90440122eedd4239b7eb0',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    extraParams: 'prompt=consent',
    authorizationUrl: 'https://auth.atlassian.com/authorize',
  },
  mountUrl: '/v2/account/acc-12d136912f0c4912/subscription/sub-a447d98de09c4cfe/integration/atlassian-test-connector',
};

export const sampleMe = require('./mock/atlassian-me.json');
