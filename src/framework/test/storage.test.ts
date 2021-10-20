import superagent from 'superagent';
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
import { randomChars } from './utilities';

jest.mock('superagent');

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
    test('It should allow to put data with expected parameters', () => {
      const putMock = jest.fn();
      const setMock = jest.fn();
      const sendMock = jest.fn();
      const storageId = randomChars();
      const bucketItemRawResponse = createStorageBucketItem(storageId);
      sendMock.mockReturnValue(bucketItemRawResponse);
      setMock.mockReturnValue({
        send: sendMock,
        set: setMock,
      });
      putMock.mockReturnValue({
        set: setMock,
      });
      superagent.put = putMock;

      const createdStorage: IStorageClient = createStorage({
        baseUrl: `https://${randomChars()}.com/api`,
        accountId: randomChars(),
        subscriptionId: randomChars(),
        functionAccessToken: randomChars(),
      });

      const body: IStorageBucketItemParams = {
        data: randomChars(),
        version: randomChars(),
        expires: new Date().toISOString(),
      };

      createdStorage.put(body, 'bucket');

      expect(sendMock).toBeCalledTimes(1);
      expect(sendMock).toHaveBeenLastCalledWith({ data: body.data, etag: body.version, expires: body.expires });
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
