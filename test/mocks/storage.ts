import { Connector } from '../../src/framework';

const testMemoryStorage: Record<string, Connector.Types.StorageBucketItem | undefined> = {};

const setData = async (ctx: object, key: string, data: Connector.Types.StorageBucketItemParams) => {
  testMemoryStorage[key] = { ...data, status: 200, storageId: key };
};
const getData = async (ctx: object, key: string) => {
  return testMemoryStorage[key];
};

export { setData, getData };
