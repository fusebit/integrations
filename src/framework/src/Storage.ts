import superagent from 'superagent';

const removeLeadingSlash = (s: string) => s.replace(/^\/(.+)$/, '$1');
const removeTrailingSlash = (s: string) => s.replace(/^(.+)\/$/, '$1');

export interface IStorageBucketItemRawResponse {
  storageId: string;
  etag: string;
  expires?: string;
  tags?: Record<string, string>;
  data?: any;
}

export interface IStorageListRawResponse {
  items: Omit<IStorageBucketItemRawResponse, 'data'>[];
  total: number;
  next?: string;
}

export interface IStorageResponseDelete {}

export interface IStorageBucketItem extends Omit<IStorageBucketItemRawResponse, 'etag'> {
  version?: string;
  status: number;
}

export interface IStorageBucketList {
  items: Omit<IStorageBucketItem, 'status'>[];
  total: number;
  status: number;
  next?: string;
}

export interface IStorageBucketResponseDelete {
  status: number;
}

export interface IStorageBucketItemParams extends Omit<IStorageBucketItem, 'storageId' | 'status'> {}

export interface IStorageClient {
  accessToken: string;
  get: (storageSubId: string) => Promise<IStorageBucketItem | undefined>;
  put: (body: IStorageBucketItemParams, storageSubId?: string) => Promise<IStorageBucketItem>;
  deletePrefixed: (storageSubId: string, version?: string) => Promise<IStorageBucketResponseDelete>;
  deleteAll: (forceRecursive: boolean) => Promise<IStorageBucketResponseDelete>;
  delete: (storageSubId: string, version?: string) => Promise<IStorageBucketResponseDelete>;
  list: (storageSubId: string, options?: IListOption) => Promise<IStorageBucketList>;
}
export interface IListOption {
  count?: number;
  next?: string;
}

export interface IStorageParam {
  baseUrl: string;
  accountId: string;
  subscriptionId: string;
  functionAccessToken: string;
  storageIdPrefix?: string;
}

export const convertItemToVersion = (body: IStorageBucketItemRawResponse, status: number): IStorageBucketItem => {
  const versionResponse: IStorageBucketItem = {
    storageId: body.storageId.split('/').slice(2).join('/'),
    data: body.data,
    tags: body.tags,
    version: body.etag,
    status,
  };
  return versionResponse;
};

export const convertListToVersion = (body: IStorageListRawResponse, status: number): IStorageBucketList => {
  const versionResponse: IStorageBucketList = {
    items: body.items.map((item) => ({
      tags: item.tags,
      version: item.etag,
      storageId: item.storageId.split('/').slice(2).join('/'),
      expires: item.expires,
    })),
    total: body.total,
    next: body.next,
    status,
  };
  return versionResponse;
};

export const createStorage = (params: IStorageParam): IStorageClient => {
  const storageIdPrefix = params.storageIdPrefix ? removeLeadingSlash(removeTrailingSlash(params.storageIdPrefix)) : '';
  const functionUrl = new URL(params.baseUrl);
  const storageBaseUrl = `${functionUrl.protocol}//${functionUrl.host}/v1/account/${params.accountId}/subscription/${
    params.subscriptionId
  }/storage${storageIdPrefix ? '/' + storageIdPrefix : ''}`;

  const getUrl = (storageSubId: string) => {
    storageSubId = storageSubId ? removeTrailingSlash(removeLeadingSlash(storageSubId)) : '';
    return `${storageBaseUrl}${storageSubId ? '/' + storageSubId : ''}`;
  };

  const storageClient: IStorageClient = {
    accessToken: params.functionAccessToken,
    get: async (storageSubId: string) => {
      storageSubId = storageSubId ? removeTrailingSlash(removeLeadingSlash(storageSubId)) : '';
      const response = await superagent
        .get(getUrl(storageSubId))
        .set('Authorization', `Bearer ${storageClient.accessToken}`)
        .ok((res) => res.status < 300 || res.status === 404);
      if (response.status == 404) {
        return undefined;
      }
      return convertItemToVersion(response.body, response.status);
    },
    put: async (body: IStorageBucketItemParams, storageSubId?: string) => {
      storageSubId = storageSubId ? removeTrailingSlash(removeLeadingSlash(storageSubId)) : '';
      if (!storageSubId && !storageIdPrefix) {
        throw new Error(
          'Storage objects cannot be stored at the root of the hierarchy. Specify a storageSubId when calling the `put` method, or a storageIdPrefix when creating the storage client.'
        );
      }
      const request = superagent.put(getUrl(storageSubId)).set('Authorization', `Bearer ${storageClient.accessToken}`);
      if (body.version) {
        request.set('If-Match', body.version);
      }
      const response = await request.send({ data: body.data, etag: body.version, expires: body.expires });
      return convertItemToVersion(response.body, response.status);
    },
    deleteAll: async (forceRecursive?: boolean) => {
      if (!forceRecursive) {
        throw new Error(
          'You are attempting to recursively delete all storage objects in the Fusebit subscription. If this is your intent, please pass "true" as the argument in the call to deleteAll(forceRecursive).'
        );
      }
      const response = await superagent
        .delete(`${getUrl('')}/*`)
        .set('Authorization', `Bearer ${storageClient.accessToken}`)
        .ok((res) => res.status === 404 || res.status === 204);
      return { status: response.status };
    },
    delete: async (storageSubId: string, version?: string) => {
      storageSubId = storageSubId ? removeLeadingSlash(removeTrailingSlash(storageSubId)) : '';
      const request = superagent
        .delete(`${getUrl(storageSubId)}`)
        .set('Authorization', `Bearer ${storageClient.accessToken}`);
      if (version) {
        request.set('If-Match', version);
      }
      const response = await request.ok((res) => res.status === 404 || res.status === 204);
      return { status: response.status };
    },
    deletePrefixed: async (storageSubId: string, version?: string) => {
      storageSubId = storageSubId ? removeLeadingSlash(removeTrailingSlash(storageSubId)) : '';
      const request = superagent
        .delete(`${getUrl(storageSubId)}/*`)
        .set('Authorization', `Bearer ${storageClient.accessToken}`);
      if (version) {
        request.set('If-Match', version);
      }
      const response = await request.ok((res) => res.status === 404 || res.status === 204);
      return { status: response.status };
    },
    list: async (storageSubId: string, { count, next }: IListOption = {}) => {
      const response = await superagent
        .get(`${getUrl(storageSubId)}/*`)
        .query(count && !isNaN(count) ? { count } : { count: 5 })
        .query(typeof next === 'string' ? { next } : {})
        .set('Authorization', `Bearer ${storageClient.accessToken}`);
      const result = convertListToVersion(response.body, response.status);
      return result;
    },
  };

  return storageClient;
};
