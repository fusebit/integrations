import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

export const startHttpServer = async () => {
  const app = express();

  const createService = async (): Promise<Server> => {
    return await new Promise((resolve) => {
      const svc = app.listen(0, () => resolve(svc));
    });
  };

  const service = await createService();

  const port = (service?.address() as AddressInfo)?.port;

  return { app, service, port, url: `http://localhost:${port}` };
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
