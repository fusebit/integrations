import superagent from 'superagent';

export interface IToBeHttp {
  statusCode?: number | number[];
}

function toBeHttp(response: superagent.Response, { statusCode }: IToBeHttp) {
  let keyValueMsg = '';
  try {
    if (statusCode) {
      if (typeof statusCode === 'object') {
        expect(statusCode).toContain(response.status);
      } else {
        expect(response.status).toEqual(statusCode);
      }
    }
  } catch (err) {
    const msg = `${err.message} ${keyValueMsg}\n\nfailing request:\n${
      response.status
    } ${response.request?.method.toUpperCase()} ${response.request?.url} - headers: ${JSON.stringify(
      response.headers,
      null,
      2
    )} - data: ${JSON.stringify(response.data, null, 2)}`;
    return { message: () => msg, pass: false };
  }
  return { message: () => '', pass: true };
}

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeHttp: ({ statusCode }: IToBeHttp) => R;
    }
  }
}

const matchers = {
  toBeHttp,
};

// Load in the enhancements to expect
const jestExpect = (global as any).expect;
if (jestExpect !== undefined) {
  jestExpect.extend(matchers);
}
