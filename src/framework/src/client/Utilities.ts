import superagent from 'superagent';
import { FusebitContext, HttpContext, Next as RouterNext } from '../router';
import * as Storage from '../Storage';

class Utilities {
  public TENANT_TAG_NAME = 'fusebit.tenantId';

  public getTenantInstalls = async (ctx: Utilities.Types.ContextType, tenantId: string) => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/install?tag=${this.TENANT_TAG_NAME}=${encodeURIComponent(tenantId)}`)
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

  public getConnectorSdkByName = async (ctx: FusebitContext, connectorName: string, installId: string) => {
    return ctx.state.manager.connectors.getByName(ctx, connectorName, installId);
  };

  public getData = (
    ctx: Utilities.Types.ContextType,
    dataKey: string
  ): Promise<Storage.IStorageBucketItem | undefined> => Storage.createStorage(ctx.state.params).get(dataKey);

  public setData = (
    ctx: Utilities.Types.ContextType,
    dataKey: string,
    body: Storage.IStorageBucketItemParams
  ): Promise<Storage.IStorageBucketItem> => Storage.createStorage(ctx.state.params).put(body, dataKey);

  public listData = (
    ctx: Utilities.Types.ContextType,
    dataKeyPrefix: string,
    options?: Storage.IListOption
  ): Promise<Storage.IStorageBucketList> => Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);

  public deleteData = (
    ctx: Utilities.Types.ContextType,
    dataKey: string,
    version?: string
  ): Promise<Storage.IStorageBucketResponseDelete> => Storage.createStorage(ctx.state.params).delete(dataKey, version);

  public deletePrefixedData = (
    ctx: Utilities.Types.ContextType,
    dataKeyPrefix: string,
    version?: string
  ): Promise<Storage.IStorageBucketResponseDelete> =>
    Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);
}

namespace Utilities {
  export namespace Types {
    export type ContextType = HttpContext;
    export type NextType = RouterNext;
  }
}

export default Utilities;
