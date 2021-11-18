// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { expect } from '@playwright/test';
import superagent from 'superagent';

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

export default {
  register: (expect) => expect.extend(matchers),
};
