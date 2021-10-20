import express from 'express';
import { test } from '@playwright/test';

export const startHttpServer = async (port: number) => {
  const app = express();

  const service = await new Promise((resolve) => {
    const svc = app.listen(port, () => resolve(svc));
  });

  return { app, service, port: service.address().port };
};

type WaitableMock = Function & {
  waitForCall(): Promise<express.Request>;
};

export const waitForExpress = (): WaitableMock => {
  let _resolve: Function;
  let promise = new Promise<express.Request>((resolve) => (_resolve = resolve));

  const mock = (request: express.Request, response: express.Response) => {
    response.status(200).send();
    _resolve(request);
  }; // force casting

  mock.waitForCall = async () => {
    const result = await promise;
    promise = new Promise<express.Request>((resolve) => (_resolve = resolve));
    return result;
  };

  return mock;
};
