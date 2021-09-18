/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import { Context as RouterContext, Next as RouterNext, Router as _Router } from '../Router';
import * as Storage from '../Storage';
import * as Middleware from '../middleware/authorize';
import { IOnStartup as IOnStartupInterface } from '../Manager';

type ContextType = RouterContext;
type NextType = RouterNext;

abstract class EntityBase {
  public readonly events = {};

  public abstract service: EntityBase.ServiceBase;
  public abstract storage: EntityBase.StorageBase;
  public abstract middleware: EntityBase.MiddlewareBase;
  public abstract response: EntityBase.ResponseBase;

  public readonly router = new _Router();
}

namespace EntityBase {
  export namespace Types {
    export type Context = ContextType;
    export type Next = NextType;
    export interface IOnStartup extends IOnStartupInterface {}
    export interface IInstanceResponse {
      items: IInstance[];
      total: number;
    }
    export interface IInstance {
      id: string;
      tags: Record<string, string>;
      data: Record<string, IInstanceData | Record<string, any>>;
      expires?: string;
      version?: string;
    }
    export interface IInstanceData {
      tags: Record<string, string>;
      entityId: string;
      entityType: string;
      accountId: string;
      subscriptionId: string;
      parentEntityId: string;
      parentEntityType: string;
    }
    export type Router = _Router;
  }
  export abstract class ServiceBase {}

  export abstract class StorageBase {
    public setData: (ctx: RouterContext, dataKey: string, data: any) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string,
      data: any,
      version?: string
    ) => Storage.createStorage(ctx.state.params).put(data, dataKey, version);
    public getData: (ctx: RouterContext, dataKey: string) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string
    ) => Storage.createStorage(ctx.state.params).get(dataKey);
    public listData: (
      ctx: RouterContext,
      dataKeyPrefix: string,
      options?: Storage.IListOption
    ) => Promise<any> = async (ctx: RouterContext, dataKeyPrefix: string, options?: Storage.IListOption) =>
      Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);
    public deleteData: (ctx: RouterContext, dataKey: string, version?: string) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string,
      version?: string
    ) => Storage.createStorage(ctx.state.params).delete(dataKey, version);
    public deletePrefixedData: (ctx: RouterContext, dataKeyPrefix: string, version?: string) => Promise<any> = (
      ctx: RouterContext,
      dataKeyPrefix: string,
      version?: string
    ) => Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);
    public deleteAllData: (ctx: RouterContext, forceDelete: boolean) => Promise<any> = (ctx, forceDelete) =>
      Storage.createStorage(ctx.state.params).deleteAll(forceDelete);
  }
  export abstract class MiddlewareBase {
    public authorizeUser = Middleware.authorize;
    public loadTenant: (tags: string) => (ctx: RouterContext, next: RouterNext) => Promise<any> = (tags: string) => {
      return async (ctx: RouterContext, next: RouterNext) => {
        return undefined; // Todo
      };
    };
    public loadConnector?: (name: string) => (ctx: RouterContext, next: RouterNext) => Promise<any>;
  }
  export abstract class ResponseBase {
    public createJsonForm: undefined; // TODO
    public createError: undefined; // TODO
  }

  export class ServiceDefault extends ServiceBase {}
  export class StorageDefault extends StorageBase {}
  export class MiddlewareDefault extends MiddlewareBase {}
  export class ResponseDefault extends ResponseBase {}
}
export default EntityBase;
