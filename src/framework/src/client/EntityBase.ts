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

/**
 * @private
 */
abstract class EntityBase {
  public readonly events = {};

  public abstract service: EntityBase.ServiceBase;
  public abstract storage: EntityBase.StorageBase;
  public abstract middleware: EntityBase.MiddlewareBase;
  public abstract response: EntityBase.ResponseBase;

  public readonly router = new HttpRouter_();
  public readonly cron = new CronRouter_(this.router);
  public readonly event = new EventRouter_(this.router);
}

namespace EntityBase {
  export namespace Types {
    export type Context = ContextType;
    export type EventContext = EventContext_;
    export type CronContext = CronContext_;
    export type Next = NextType;
    export interface IOnStartup extends IOnStartupInterface {}
    export interface IInstallResponse {
      items: IInstall[];
      total: number;
    }
    export interface IInstall {
      id: string;
      tags: Record<string, string>;
      data: Record<string, IInstallData | Record<string, any>>;
      expires?: string;
      version?: string;
    }
    export interface IInstallData {
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
  /**
   * @private
   */
  export abstract class ServiceBase {}

  /**
   * @alias integration.storage
   */
  export abstract class StorageBase {
    /**
     * Save any data in JSON format up to ~400Kb in size.
     *
     * @example
     * router.post('/api/tenant/:tenantId/colors', async (ctx) => {
     *    // By convention we use / symbol to represent a bucket, but you can use any name you want.
     *    const bucketName = '/my-bucket/';
     *    const key = 'colors';
     *    const data = ['green', 'blue'];
     *    const result = await integration.storage.setData(ctx, `${bucketName}${key}`, data);
     *    ctx.body = result;
     * });
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Represents a reference to your data that you will use in further
     * operations like read, delete and update
     * @property {object} body Represents the storage data and metadata
     * @property {string} body.data Any valid JSON with the data you want to store
     * @property {string} [body.version] Version coming from the original getData in order
     * to prevent conflicts when multiple writers may attempt to write at the same time
     * @property {string} [body.expires] Expiration date (YYYY-MM-DD HH:MI:SS) for the data
     * @returns {Promise<Storage.IStorageVersionedResponse>}
     */
    public setData = (
      ctx: ContextType,
      dataKey: string,
      body: Storage.IStorageBody
    ): Promise<Storage.IStorageVersionedResponse> => Storage.createStorage(ctx.state.params).put(body, dataKey);

    /**
     * Get saved data
     *
     * @param ctx The context object provided by the route function
     * @param {string} dataKey The key name used for referencing the stored data
     * @returns {Promise<Storage.IStorageVersionedResponse | undefined>}
     */
    public getData = (ctx: ContextType, dataKey: string): Promise<Storage.IStorageVersionedResponse | undefined> =>
      Storage.createStorage(ctx.state.params).get(dataKey);

    /**
     * A listing operation query data stored in an artifact known as a Bucket (Buckets are
     *
     * collections of keys where you can store related data). Read more at
     * https://developer.fusebit.io/docs/integration-programming-model#listing-data
     * @example
     * router.get('/api/tenant/:tenantId/my-bucket', async (ctx) => {
     *        const bucketName = '/my-bucket/';
     *        const result = await integration.storage.listData(ctx, bucketName);
     *        ctx.body = result;
     * });
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {Storage.IListOption} options The bucket name
     * @returns {Promise<Storage.IStorageVersionedResponseList>} A list of Storage items
     */
    public listData = (
      ctx: ContextType,
      dataKeyPrefix: string,
      options?: Storage.IListOption
    ): Promise<Storage.IStorageVersionedResponseList> =>
      Storage.createStorage(ctx.state.params).list(dataKeyPrefix, options);

    /**
     * Delete data
     *
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Reference the key name used for storing the data
     * @param {string=} version Delete a specific version of the stored data
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deleteData = (
      ctx: ContextType,
      dataKey: string,
      version?: string
    ): Promise<Storage.IStorageVersionedResponseDelete> =>
      Storage.createStorage(ctx.state.params).delete(dataKey, version);

    /**
     * Delete data stored in an artifact known as a Bucket
     *
     * (This function will remove a collection of keys stored under the specified Bucket).
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {string=} version Delete a specific version of the Bucket
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deletePrefixedData = (
      ctx: ContextType,
      dataKeyPrefix: string,
      version?: string
    ): Promise<Storage.IStorageVersionedResponseDelete> =>
      Storage.createStorage(ctx.state.params).deletePrefixed(dataKeyPrefix, version);

    /**
     * Recursively delete all storage objects in the Fusebit subscription.
     *
     * @param ctx The context object provided by the route function
     * @param {boolean} forceDelete You need to force a delete (set to true),
     * otherwise it will throw an error
     * @returns {Promise<Storage.IStorageVersionedResponseDelete>}
     */
    public deleteAllData = (ctx: ContextType, forceDelete: boolean): Promise<Storage.IStorageVersionedResponseDelete> =>
      Storage.createStorage(ctx.state.params).deleteAll(forceDelete);
  }

  /**
   * @alias integration.middleware
   */
  export abstract class MiddlewareBase {
    /**
     * Usually, the routes you define in an integration require protection against unauthorized access.
     * This function restricts access to users authenticated in Fusebit with the specified permission.
     * @param {string} action Name of the action to authorize
     * @alias authorize
     * @throws {Error} With 403 code, meaning access to the requested resource is forbidden.
     * @example
     *    router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('instance:get'), async (ctx) => {
     *        // Implement your code here
     *    });
     * @returns {Promise<any>}
     */
    public authorizeUser = Middleware.authorize;
    /**
     * Middleware that can be used to perform input and parameter validation, using Joi, on handlers.
     *
     * Note: The validate function includes a joi member to allow callers to easily specify validation rules.
     *
     * See the [Joi](https://joi.dev/api/?v=17.4.2) documentation for more details.
     *
     * @alias validate
     * @example
     *   const integration = new Integration();
     *   const Joi = integration.middleware.validate.joi;
     *
     *   integration.router.get('/api/example',
     *     integration.middleware.validate({query: Joi.object({ aKey: Joi.string().required() }) }),
     *     async (ctx) => {
     *       ctx.body = { result: ctx.query.aKey };
     *     }
     *   );
     * @returns {<Promise<any>>}
     */
    public validate = Middleware.validate;
  }
  /**
   * @private
   */
  export abstract class ResponseBase {
    public createJsonForm = Form;
  }

  /**
   * @private
   */
  export class ServiceDefault extends ServiceBase {}
  /**
   * @private
   */
  export class StorageDefault extends StorageBase {}
  /**
   * @private
   */
  export class MiddlewareDefault extends MiddlewareBase {}
  /**
   * @private
   */
  export class ResponseDefault extends ResponseBase {}
}

export default EntityBase;
