import { expect, PlaywrightTestConfig } from '@playwright/test';
import matchers from './matchers';
import * as dotenv from 'dotenv';

const cfg = dotenv.config({ path: '.env.playwright' });
if (cfg.error) {
  const msg = [
    '',
    'ERROR: Missing .env.playwright file!',
    '',
    'Create a .env.playwright file, using this as the template:',
    '',
    "OAUTH_USERNAME='username-for-testuser-oauth-login'",
    "OAUTH_PASSWORD='password-for-testuser-oauth-login'",
    "SECRET_CLIENTID='oauth-test-app-clientid'",
    "SECRET_CLIENTSECRET='oauth-test-app-clientsecret'",
    "INTEGRATION_ID='reusable-oauth-integration-id'",
    "CONNECTOR_ID='reusable-oauth-connector-id'",
    'PACKAGE_PROVIDER=@fusebit-int/<name>-provider',
    'PACKAGE_CONNECTOR=@fusebit-int/<name>-connector',
    'AUTHORIZATION_URL=',
    'TOKEN_URL=',
    'SIGNING_SECRET=',
    'EXTRA_PARAMS=',
    '',
    'Many systems require a consistent and predictable id for webhooks, callback',
    "urls, etc.  Choose an integration id and a connector id that won't conflict",
    'with other automated tests.',
  ].join('\n');
  throw msg;
}

export const playWrightConfig: PlaywrightTestConfig = {
  timeout: 180000,
  testDir: 'play',
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['line', {}],
  ],
  use: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/98.0.4695.0 Safari/537.36',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
};

matchers.register(expect);
