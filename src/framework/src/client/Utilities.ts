import superagent from 'superagent';
import { FusebitContext, HttpContext, Next as RouterNext } from '../router';

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
}

namespace Utilities {
  export namespace Types {
    export type ContextType = HttpContext;
    export type NextType = RouterNext;
  }
}

export default Utilities;
