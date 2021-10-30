// Cross namespace utilities
import { FusebitContext } from '../router';
import superagent from 'superagent';

export const TENANT_TAG_NAME = 'fusebit.tenantId';

export const getTenantInstalls = async (ctx: FusebitContext, tenantId: string) => {
  const response = await superagent
    .get(`${ctx.state.params.baseUrl}/install?tag=${TENANT_TAG_NAME}=${encodeURIComponent(tenantId)}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
  return response.body;
};
