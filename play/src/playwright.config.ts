// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
    '',
    'Many systems require a consistent and predictable id for webhooks, callback',
    "urls, etc.  Choose an integration id and a connector id that won't conflict",
    'with other automated tests.',
  ].join('\n');
  throw msg;
}

const config: PlaywrightTestConfig = {
  timeout: 180000,
  testDir: 'play',
  reporter: [['json', { outputFile: 'results.json' }]],
};

matchers.register(expect);

export default config;
