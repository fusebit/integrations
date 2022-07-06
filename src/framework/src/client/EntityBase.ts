/* tslint:disable no-namespace no-empty-interface max-classes-per-file */
import {
  HttpContext as ContextType,
  CronContext as CronContext_,
  EventContext as EventContext_,
  HttpRouter as HttpRouter_,
  CronRouter as CronRouter_,
  EventRouter as EventRouter_,
  TaskRouter as TaskRouter_,
  Next as RouterNext,
} from '../router';
import * as Middleware from '../middleware';
import Utilities from './Utilities';
import { Form } from '../Form';
import { IOnStartup as IOnStartupInterface } from '../Manager';
import { IStorageBucketItem, IStorageBucketItemParams } from '../Storage';

const utilities = new Utilities();

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
  public readonly task = new TaskRouter_(this.router);

  protected readonly utilities = utilities;
}

namespace EntityBase {
  export namespace Types {
    export type Context = ContextType;
    export type EventContext = EventContext_;
    export type CronContext = CronContext_;
    export type Next = RouterNext;
    export interface IOnStartup extends IOnStartupInterface {}
    export interface IInstallResponse {
      items: IInstall[];
      total: number;
    }
    export interface IInstall {
      id: string;
      parentId: string;
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
    export interface StorageBucketItem extends IStorageBucketItem {}
    export interface StorageBucketItemParams extends IStorageBucketItemParams {}
  }
  /**
   * @private Shared utility functions across namespaces
   */
  abstract class EntityNamespace {
    protected readonly utilities = utilities;
  }
  /**
   * Installation specific utilities for accessing Connectors client SDKs and installation information.
   * @private
   */
  export abstract class ServiceBase extends EntityNamespace {
    protected readonly utilities = utilities;
  }

  /**
   * Secure and reliable storage utilities. You can write, read, update and delete hierarchical data in a versioned fashion.
   * @alias integration.storage
   */
  export abstract class StorageBase {
    protected readonly utilities = utilities;
    /**
     * Save any data in JSON format up to ~400Kb in size.
     *
     * @example
     * router.post('/api/tenant/:tenantId/colors', async (ctx) => {
     *    const bucketName = '/my-bucket/';
     *    const key = 'colors';
     *    const data = ['green', 'blue'];
     *    const result = await integration.storage.setData(ctx, `${bucketName}${key}`, { data });
     *    ctx.body = result;
     * });
     *
     * @example
     * Storing temporary data that expires at specific date:
     *
     * router.post('/api/tenant/:tenantId/colors', async (ctx) => {
     *    const bucketName = '/my-bucket/';
     *    const key = 'colors';
     *    const expirationDate = new Date();
     *    expirationDate.setDate(expirationDate.getDate() + 1);
     *    const data = ['green', 'blue'];
     *    const result = await integration.storage.setData(ctx, `${bucketName}${key}`,
     *      {
     *        data,
     *        expires: expirationDate.toISOString()
     *      });
     *
     *    ctx.body = result;
     * });
     *
     *
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Represents a reference to your data that you will use in further
     * operations like read, delete and update
     * @property {Storage.IStorageBucketItemParams} body Represents the storage data and metadata
     * @property {string} body.data Any valid JSON with the data you want to store
     * @property {string} [body.version] Version coming from the original getData in order
     * to prevent conflicts when multiple writers may attempt to write at the same time
     * @property {string} [body.expires] Set an expiration date (ISO 8601 format) for your data
     * @returns {Promise<Storage.IStorageBucketResponse>}
     */
    public setData = this.utilities.setData;

    /**
     * Get saved data
     *
     * @param ctx The context object provided by the route function
     * @param {string} dataKey The key name used for referencing the stored data
     * @returns {Promise<Storage.IStorageBucketResponse | undefined>}
     */
    public getData = this.utilities.getData;

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
     * @returns {Promise<Storage.IStorageBucketList>} A list of Storage items
     */
    public listData = this.utilities.listData;

    /**
     * Delete data
     *
     * @param ctx The context object provided by the route function
     * @param {string} dataKey Reference the key name used for storing the data
     * @param {string=} version Delete a specific version of the stored data
     * @returns {Promise<Storage.IStorageBucketResponseDelete>}
     */
    public deleteData = this.utilities.deleteData;

    /**
     * Delete data stored in an artifact known as a Bucket
     *
     * (This function will remove a collection of keys stored under the specified Bucket).
     * @param ctx The context object provided by the route function
     * @param {string} dataKeyPrefix The bucket name
     * @param {string=} version Delete a specific version of the Bucket
     * @returns {Promise<Storage.IStorageBucketResponseDelete>}
     */
    public deletePrefixedData = this.utilities.deletePrefixedData;
  }

  /**
   * Powerful and useful middlewares like user authorization and input validation.
   * @alias integration.middleware
   */
  export abstract class MiddlewareBase {
    protected readonly utilities = utilities;
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

    /**
     * Middleware that adds the ability to create new users of an integration without a backend.
     */
    public session = Middleware.session;
  }
  /**
   * Response utilities that give you access to useful functionalities like Json Forms creation.
   * @alias integration.response
   * @class
   */
  export abstract class ResponseBase {
    protected readonly utilities = utilities;
    public createJsonForm = Form;
  }
  /**
   * @private
   */
  export abstract class TenantBase {
    protected readonly utilities = utilities;
  }
  /**
   * @private
   */
  export abstract class WebhookBase {
    protected readonly utilities = utilities;
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
  /**
   * @private
   */
  export class WebhookDefault extends WebhookBase {}
  /**
   * @private
   */
  export class TenantDefault extends TenantBase {}
}

export default EntityBase;
