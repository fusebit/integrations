import {
  convertItemToVersion,
  convertListToVersion,
  IStorageBucketItem,
  IStorageBucketItemRawResponse,
  IStorageBucketListResponse,
  IStorageListRawResponse,
} from '../src/Storage';
import { randomChars } from './utilities';

describe('Storage SDK Test suite', () => {
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

      const expectedResponse: IStorageBucketListResponse = {
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
      const expectedResponse: IStorageBucketListResponse = {
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
