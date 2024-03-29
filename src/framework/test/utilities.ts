import { Internal } from '../src';
import { FusebitContext } from '../src/router';

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
  configuration: {
    defaultEventHandler: '',
  },
  mountUrl: '',
  schedule: [],
});

export const getContext: () => FusebitContext = () =>
  (({
    state: {
      params: {
        endpoint: Constants.endpoint,
        accountId: Constants.accountId,
        subscriptionId: Constants.subscriptionId,
        baseUrl: Constants.endpoint,
        entityId: Constants.connectorId,
      },
    },
    throw: jest.fn(() => {
      throw new Error();
    }),
  } as unknown) as FusebitContext);

export const request = (
  method: string,
  path: string,
  options?: { headers?: any; query?: any; body?: any; state?: any; caller?: any }
) => {
  return { method, path, ...options };
};

export const randomChars = (): string => {
  return Math.random().toString().substring(2);
};
