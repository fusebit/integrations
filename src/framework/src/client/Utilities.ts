import superagent from 'superagent';
import { FusebitContext } from '../router';
import * as Storage from '../Storage';

class Utilities {
  public TENANT_TAG_NAME = 'fusebit.tenantId';
  public INSTALL_CUSTOM_TAG_NAME = 'fusebit.install';

  public getTenantInstalls = async (ctx: FusebitContext, tenantId: string) => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/install?tag=${this.TENANT_TAG_NAME}%3D${encodeURIComponent(tenantId)}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;

    if (body.items.length === 0) {
      ctx.throw(404, `Cannot find an Integration Install associated with tenant ${tenantId}`);
    }

    if (body.items.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tenant ${tenantId}`);
    }

    return body.items;
  };

  public listByTag = async (ctx: FusebitContext, subComponent: string, tagKey?: string, tagValue?: string) => {
    const response = await superagent
      .get(
        `${ctx.state.params.baseUrl}/${subComponent}${
          tagKey ? `?tag=${encodeURIComponent(tagKey)}${tagValue ? `%3D${encodeURIComponent(tagValue)}` : ''}` : ''
        }`
      )
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    return response.body;
  };

  public listByTags = async (
    ctx: FusebitContext,
    subComponent: string,
    tags: Record<string, string>,
    tagPrefix?: string
  ) => {
    const url = new URL(`${ctx.state.params.baseUrl}/${subComponent}`);

    Object.keys(tags).forEach((tag) => {
      const searchTag = `${tagPrefix ? `${tagPrefix}.` : ''}${tag}=${tags[tag]}`;
      url.searchParams.append('tag', searchTag);
    });

    const response = await superagent
      .get(Buffer.from(url.toString(), 'utf-8').toString())
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    return response.body;
  };

  public getConnectorSdkByName = async (ctx: FusebitContext, connectorName: string, installId: string) => {
    return ctx.state.manager.connectors.getByName(ctx, connectorName, installId);
  };

  public getData = (ctx: FusebitContext, dataKey: string): Promise<Storage.IStorageBucketItem | undefined> =>
    Storage.createStorage(ctx.state.params).get(dataKey);

  public setData = (
    ctx: FusebitContext,
    dataKey: string,
    body: Storage.IStorageBucketItemParams
  ): Promise<Storage.IStorageBucketItem> => Storage.createStorage(ctx.state.params).put(body, dataKey);

  public listData = (
    ctx: FusebitContext,
    dataKeyPrefix: string,
    options?: Storage.IListOption
  ): Promise<Storage.IStorageBucketList> => Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);

  public deleteData = (
    ctx: FusebitContext,
    dataKey: string,
    version?: string
  ): Promise<Storage.IStorageBucketResponseDelete> => Storage.createStorage(ctx.state.params).delete(dataKey, version);

  public deletePrefixedData = (
    ctx: FusebitContext,
    dataKeyPrefix: string,
    version?: string
  ): Promise<Storage.IStorageBucketResponseDelete> =>
    Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);
}

export default Utilities;
