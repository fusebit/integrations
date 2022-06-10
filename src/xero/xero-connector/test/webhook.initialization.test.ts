import { ServiceConnector } from '../src';

import { Connector } from '@fusebit-int/framework';

export const initEvent = require('./mock/initialization.json');

const initCtx = {
  req: { headers: { ['x-xero-signature']: initEvent.requestSignature }, body: initEvent.body },
  state: { manager: { config: { configuration: { signingSecret: initEvent.signingSecret } } } },
  throw: jest.fn(),
};

let service: any;
let connector: Connector;

const createMockConnector = () => {
  connector = new ServiceConnector();
  service = connector.service;
};

beforeAll(() => {
  createMockConnector();
});

describe('Xero Initialization Challenge Events', () => {
  test('Validate: validateWebhookEvent succeeds', async () => {
    expect(await service.validateWebhookEvent(initCtx)).toBeTruthy();
    expect(initCtx.throw).not.toHaveBeenCalled();
  });

  test('Validate: invalid validateWebhookEvent fails', async () => {
    initCtx.req.headers['x-xero-signature'] = 'AAAUXEMvTpFa7ckjerrQBncflee5tqf+fyZoDgNTic0=';
    await service.validateWebhookEvent(initCtx);
    expect(initCtx.throw).toHaveBeenCalled();
  });

  test('Validate: initializationChallenge false', async () => {
    expect(await service.initializationChallenge(initCtx)).toBe(true);
  });
});
