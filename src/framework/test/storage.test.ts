import nock from 'nock';
import {
  convertItemToVersion,
  convertListToVersion,
  createStorage,
  IStorageBucketItem,
  IStorageBucketItemParams,
  IStorageBucketItemRawResponse,
  IStorageBucketList,
  IStorageClient,
  IStorageListRawResponse,
} from '../src/Storage';
import { getContext, randomChars } from './utilities';

const createStorageBucketItem = (storageId: string): IStorageBucketItemRawResponse => {
  const bucketItemRawResponse: IStorageBucketItemRawResponse = {
    storageId: `integration/boundary-id/${storageId}`,
    etag: randomChars(),
    data: randomChars(),
    expires: new Date().toISOString(),
    tags: {
      test: randomChars(),
    },
  };
  return bucketItemRawResponse;
};

describe('Storage SDK Test suite', () => {
  describe('SDK Methods', () => {
    test('It should allow to put data with expected parameters', async () => {
      const ctx = getContext();
      const responseDelay = 200;
      const storageId = randomChars();
      const bucketItemRawResponse = createStorageBucketItem(storageId);
      const { data, etag, expires } = bucketItemRawResponse;
      const body: IStorageBucketItemParams = {
        data,
        version: etag,
        expires,
      };
      const requestNock = nock(
        `${ctx.state.params.baseUrl}/v1/account/${ctx.state.params.accountId}/subscription/${ctx.state.params.subscriptionId}`
      );
      const createdStorage: IStorageClient = createStorage({
        baseUrl: ctx.state.params.baseUrl,
        accountId: ctx.state.params.accountId,
        subscriptionId: ctx.state.params.subscriptionId,
        functionAccessToken: randomChars(),
      });

      requestNock
        .put(`/storage/${storageId}`, (body) => body)
        .delay(responseDelay)
        .reply(200, bucketItemRawResponse);

      requestNock.get(`/storage/${storageId}`).delay(responseDelay).reply(200, bucketItemRawResponse);

      const getBucketItemResponse: IStorageBucketItem | undefined = await createdStorage.get(storageId);
      expect(getBucketItemResponse?.status).toStrictEqual(200);

      if (getBucketItemResponse) {
        const savedBucketItemResponse: IStorageBucketItem = await createdStorage.put(getBucketItemResponse, storageId);
        expect(savedBucketItemResponse).toStrictEqual(getBucketItemResponse);
      }

      expect(requestNock.isDone()).toBe(true);
      expect(requestNock.pendingMocks()).toEqual([]);
    });
  });
  test('It should map properly a bucket item to the expected response', () => {
    const status = 200;
    const storageId = randomChars();
    const bucketItemRawResponse = createStorageBucketItem(storageId);
    const expectedResponse: IStorageBucketItem = {
      storageId: storageId,
      data: bucketItemRawResponse.data,
      tags: bucketItemRawResponse.tags,
      version: bucketItemRawResponse.etag,
      status,
    };

    const bucketItemVersion = convertItemToVersion(bucketItemRawResponse, status);
    expect(bucketItemVersion).toStrictEqual(expectedResponse);
  });

  describe('For bucket list', () => {
    test('Without pagination, it should map properly to the expected response', () => {
      const status = 200;
      const storageId = randomChars();
      const bucketItem = createStorageBucketItem(storageId);
      const bucketItemRawResponse: IStorageListRawResponse = {
        items: [bucketItem],
        total: 1,
      };

      const expectedResponse: IStorageBucketList = {
        items: [
          {
            tags: bucketItem.tags,
            version: bucketItem.etag,
            storageId,
            expires: bucketItem.expires,
          },
        ],
        total: 1,
        status,
        next: undefined,
      };

      const bucketListVersion = convertListToVersion(bucketItemRawResponse, status);
      expect(bucketListVersion).toStrictEqual(expectedResponse);
    });

    test('With pagination, it should map properly to the expected response', () => {
      const status = 200;
      const storageId = randomChars();
      const bucketItem1 = createStorageBucketItem(storageId);
      const bucketItem2 = createStorageBucketItem(storageId);
      const bucketItems = [bucketItem1, bucketItem2];
      const total = bucketItems.length;
      const next = (total + 1).toString();
      const bucketItemRawResponse: IStorageListRawResponse = {
        items: bucketItems,
        total,
        next,
      };

      const bucketItemsResponse = bucketItems.map((item) => {
        return {
          storageId,
          version: item.etag,
          expires: item.expires,
          tags: item.tags,
        };
      });
      const expectedResponse: IStorageBucketList = {
        items: bucketItemsResponse,
        total: bucketItemsResponse.length,
        status,
        next,
      };
      const bucketListVersion = convertListToVersion(bucketItemRawResponse, status);
      expect(bucketListVersion).toStrictEqual(expectedResponse);
    });
  });
});
