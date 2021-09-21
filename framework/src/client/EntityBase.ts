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
    /** Save any data in JSON format up to ~400Kb in size.
     * @example
     * ```
     * router.post('/api/tenant/:tenantId/colors', async (ctx) => {
     *    // By convention we use / symbol to represent a bucket, but you can use any name you want.
     *    const bucketName = '/my-bucket/';
     *    const key = 'colors';
     *    const data = ['green', 'blue'];
     *    const result = await integration.storage.setData(ctx, `${bucketName}${key}`, data);
     *    ctx.body = result;
     * });
     * ```
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Represents a reference to your data that you will use in further
     * operations like read, delete and update
     * @param {string} data Any valid JSON
     * @returns {Promise<any>}
     */
    public setData: (ctx: RouterContext, dataKey: string, data: any) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string,
      data: any,
      version?: string
    ) => Storage.createStorage(ctx.state.params).put(data, dataKey, version);

    /** Get saved data
     * @param ctx The context object provided by the route function
     * @param {string} dataKey The key name used for referencing the stored data
     * @returns {Promise<any>}
     */
    public getData: (ctx: RouterContext, dataKey: string) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string
    ) => Storage.createStorage(ctx.state.params).get(dataKey);

    /** A listing operation query data stored in an artifact known as a Bucket (Buckets are
     * collections of keys where you can store related data). Read more at
     * https://developer.fusebit.io/docs/integration-programming-model#listing-data
     * @example
     * ```
     * router.get('/api/tenant/:tenantId/my-bucket', async (ctx) => {
     *        const bucketName = '/my-bucket/';
     *        const result = await integration.storage.listData(ctx, bucketName);
     *        ctx.body = result;
     * });
     * ```
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {Storage.IListOption} options The bucket name
     * @returns {Promise<Storage.IStorageVersionedResponseList>} A list of Storage items
     */
    public listData: (
      ctx: RouterContext,
      dataKeyPrefix: string,
      options?: Storage.IListOption
    ) => Promise<any> = async (ctx: RouterContext, dataKeyPrefix: string, options?: Storage.IListOption) =>
      Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);

    /** Delete data
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Reference the key name used for storing the data
     * @param {string=} version Delete a specific version of the stored data
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deleteData: (ctx: RouterContext, dataKey: string, version?: string) => Promise<any> = async (
      ctx: RouterContext,
      dataKey: string,
      version?: string
    ) => Storage.createStorage(ctx.state.params).delete(dataKey, version);

    /** Delete data stored in an artifact known as a Bucket
     * (This function will remove a collection of keys stored under the specified Bucket).
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {string=} version Delete a specific version of the Bucket
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deletePrefixedData: (ctx: RouterContext, dataKeyPrefix: string, version?: string) => Promise<any> = (
      ctx: RouterContext,
      dataKeyPrefix: string,
      version?: string
    ) => Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);

    /** Recursively delete all storage objects in the Fusebit subscription.
     * @param ctx The context object provided by the route function
     * @param {boolean} forceDelete You need to force a delete (set to true),
     * otherwise it will throw an error
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
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
