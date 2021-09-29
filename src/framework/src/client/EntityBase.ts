/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import {
  HttpContext,
  CronContext as CronContext_,
  EventContext as EventContext_,
  Next as RouterNext,
  HttpRouter as HttpRouter_,
  CronRouter as CronRouter_,
  EventRouter as EventRouter_,
} from '../router';
import * as Storage from '../Storage';
import * as Middleware from '../middleware';

import { Form } from '../Form';

import { IOnStartup as IOnStartupInterface } from '../Manager';

type ContextType = HttpContext;
type NextType = RouterNext;

abstract class EntityBase {
  constructor() {
    this.router = new HttpRouter_();
    this.cron = new CronRouter_(this.router);
    this.event = new EventRouter_(this.router);
  }

  public readonly events = {};

  public abstract service: EntityBase.ServiceBase;
  public abstract storage: EntityBase.StorageBase;
  public abstract middleware: EntityBase.MiddlewareBase;
  public abstract response: EntityBase.ResponseBase;

  public readonly router: HttpRouter_;
  public readonly cron: CronRouter_;
  public readonly event: EventRouter_;
}

namespace EntityBase {
  export namespace Types {
    export type Context = ContextType;
    export type EventContext = EventContext_;
    export type CronContext = CronContext_;
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
    export type Router = HttpRouter_;
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
    public setData = (ctx: ContextType, dataKey: string, data: any, version?: string): Promise<any> =>
      Storage.createStorage(ctx.state.params).put(data, dataKey, version);

    /** Get saved data
     * @param ctx The context object provided by the route function
     * @param {string} dataKey The key name used for referencing the stored data
     * @returns {Promise<any>}
     */
    public getData = (ctx: ContextType, dataKey: string): Promise<any> =>
      Storage.createStorage(ctx.state.params).get(dataKey);

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
    public listData = (ctx: ContextType, dataKeyPrefix: string, options?: Storage.IListOption): Promise<any> =>
      Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);

    /** Delete data
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Reference the key name used for storing the data
     * @param {string=} version Delete a specific version of the stored data
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deleteData = (ctx: ContextType, dataKey: string, version?: string): Promise<any> =>
      Storage.createStorage(ctx.state.params).delete(dataKey, version);

    /** Delete data stored in an artifact known as a Bucket
     * (This function will remove a collection of keys stored under the specified Bucket).
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {string=} version Delete a specific version of the Bucket
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deletePrefixedData = (ctx: ContextType, dataKeyPrefix: string, version?: string): Promise<any> =>
      Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);

    /** Recursively delete all storage objects in the Fusebit subscription.
     * @param ctx The context object provided by the route function
     * @param {boolean} forceDelete You need to force a delete (set to true),
     * otherwise it will throw an error
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deleteAllData = (ctx: ContextType, forceDelete: boolean): Promise<any> =>
      Storage.createStorage(ctx.state.params).deleteAll(forceDelete);
  }

  export abstract class MiddlewareBase {
    public authorizeUser = Middleware.authorize;
    public validate = Middleware.validate;
  }
  export abstract class ResponseBase {
    public createJsonForm = Form;
  }

  export class ServiceDefault extends ServiceBase {}
  export class StorageDefault extends StorageBase {}
  export class MiddlewareDefault extends MiddlewareBase {}
  export class ResponseDefault extends ResponseBase {}
}

export default EntityBase;
