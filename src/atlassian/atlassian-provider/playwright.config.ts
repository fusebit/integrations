import { expect, PlaywrightTestConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

import superagent from 'superagent';

const cfg = dotenv.config({ path: '.env.playwright' });
if (cfg.error) {
  const msg = [
    '',
    'ERROR: Missing .env.playwright file!',
    '',
    'Create a .env.playwright file, using this as the template:',
    '',
    `OAUTH_USERNAME='username-for-oauth-login'`,
    `OAUTH_PASSWORD='password-for-oauth-login'`,
    `SECRET_CLIENTID='oauth-app-clientid'`,
    `SECRET_CLIENTSECRET='oauth-app-clientsecret'`,
    '',
  ].join('\n');
  throw msg;
}

interface IToBeHttp {
  statusCode?: number | number[];
  data?: any;
}

function toBeHttp(response: superagent.Response, { statusCode, data }: IToBeHttp) {
  let keyValueMsg = '';
  try {
    if (statusCode) {
      if (typeof statusCode === 'object') {
        expect(statusCode).toContain(response.status);
      } else {
        expect(response.status).toEqual(statusCode);
      }
    }
    if (data) {
      if (typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
          keyValueMsg = `on data '${key}', expecting ${JSON.stringify(value)}`;
          if (typeof value === 'object' && value !== null) {
            expect(response.body[key]).toMatchObject(value);
          } else {
            expect(response.body[key]).toEqual(value);
          }
        }
      } else {
        expect(response.data).toEqual(data);
      }
    }
  } catch (err) {
    const msg = `${err.message} ${keyValueMsg}\n\nfailing request:\n${
      response.status
    } ${response.request?.method.toUpperCase()} ${response.request?.url} - headers: ${JSON.stringify(
      response.headers,
      null,
      2
    )} - data: ${JSON.stringify(response.body, null, 2)}`;
    return { message: () => msg, pass: false };
  }
  return { message: () => '', pass: true };
}

const matchers = {
  toBeHttp,
};

// Load in the enhancements to expect
expect.extend(matchers);

// Try to extend it to the PlaywrightTest Matcher
declare namespace PlaywrightTest {
  interface Matchers<R> {
    toBeHttp: ({ statusCode }: IToBeHttp) => R;
  }
}

const config: PlaywrightTestConfig = {
  timeout: 180000,
  testDir: 'play',
};

export default config;
