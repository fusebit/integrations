export const endpoint = 'http://somedeployment.fusebit.io';
export const accountId = 'acc-0000000000000000';
export const subscriptionId = 'sub-0000000000000000';

export const ctx = {
  state: {
    params: {
      endpoint,
      accountId,
      subscriptionId,
    },
  },
  throw: jest.fn(),
};
