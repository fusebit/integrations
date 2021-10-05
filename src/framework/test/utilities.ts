import { Internal } from '../src';

export const Constants = {
  endpoint: 'http://somedeployment.fusebit.io',
  accountId: 'acc-0000000000000000',
  subscriptionId: 'sub-0000000000000000',
  connectorName: 'aSampleConnector',
  connectorId: 'aSampleConnectorId',
};

export const getIntegrationConfig = (options?: { withDummyConnector: boolean }): Internal.Types.IConfig => ({
  handler: '',
  components: [
    ...(options?.withDummyConnector
      ? [
          {
            name: Constants.connectorName,
            path: '/api/callback',
            provider: '@fusebit-int/test-provider',
            entityId: Constants.connectorId,
            entityType: 'connector',
          },
        ]
      : []),
  ],
  configuration: {},
  defaultEventHandler: '',
  mountUrl: '',
  schedule: [],
});

export const getContext = (throwError?: boolean) => ({
  state: {
    params: {
      endpoint: Constants.endpoint,
      accountId: Constants.accountId,
      subscriptionId: Constants.subscriptionId,
    },
  },
  throw: throwError
    ? jest.fn(() => {
        throw new Error();
      })
    : jest.fn(),
});

export const request = (method: string, path: string, options?: { headers?: any; query?: any; body?: any }) => {
  return { method, path, ...options };
};
