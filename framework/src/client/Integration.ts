/* tslint:disable:max-classes-per-file no-empty-interface no-namespace */
import EntityBase from './EntityBase';
import { Context as RouterContext, Next as RouterNext } from '../Router';
import superagent from 'superagent';

const TENANT_TAG_NAME = 'fusebit.tenantId';

class Middleware extends EntityBase.MiddlewareBase {
  public loadConnector = (name: string) => async (ctx: RouterContext, next: RouterNext) => undefined; // TODO
}

export class Service extends EntityBase.ServiceBase {
  public getSdk = async (ctx: RouterContext, connectorName: string, instanceId: string) => {
    return ctx.state.manager.connectors.getByName(ctx, connectorName, instanceId);
  };

  public getSdks = (ctx: RouterContext, connectorNames: string[], instanceId: string) => {
    return connectorNames.map((connectorName) => this.getSdk(ctx, connectorName, instanceId));
  };

  public getInstance = async (ctx: RouterContext, instanceId: string): Promise<EntityBase.Types.IInstance> => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/instance/${instanceId}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;
    return body;
  };
}

class Tenant {
  public service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  public getSdkByTenant = async (ctx: RouterContext, connectorName: string, tenantId: string) => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/instance?tag=${TENANT_TAG_NAME}=${encodeURIComponent(tenantId)}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;

    if (body.items.length === 0) {
      ctx.throw(404, `Cannot find an Integration Instance associated with tenant ${tenantId}`);
    }

    if (body.items.length > 1) {
      ctx.throw(400, `Too many Integration Instances found with tenant ${tenantId}`);
    }

    return this.service.getSdk(ctx, connectorName, body.items[0].id);
  };
}

namespace Integration {
  export namespace Types {
    export type Context = EntityBase.Types.Context;
    export type Next = EntityBase.Types.Next;
    export interface IOnStartup extends EntityBase.Types.IOnStartup {}
    export interface IInstance extends EntityBase.Types.IInstance {}
  }
}
export default class Integration extends EntityBase {
  public service = new Service();
  public middleware = new Middleware();
  public storage = new EntityBase.StorageDefault();
  public tenant = new Tenant(this.service);
  public response = new EntityBase.ResponseDefault();
}
