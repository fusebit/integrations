/* tslint:disable:max-classes-per-file no-empty-interface no-namespace */
import EntityBase from './EntityBase';
import { FusebitContext } from '../router';
import superagent from 'superagent';

const TENANT_TAG_NAME = 'fusebit.tenantId';

/**
 * @class Middleware
 * @augments MiddlewareBase
 * @private
 */
class Middleware extends EntityBase.MiddlewareBase {}

/**
 * @class
 * @alias integration.service
 * @augments EntityBase.ServiceBase
 */
export class Service extends EntityBase.ServiceBase {
  /**
   * Get an authenticated SDK for the specified Connector, using a given Install.
   * @param {FusebitContext} ctx The context object provided by the route function
   * @param {string} connectorName The name of the Connector from the service to interact with
   * @param {string} installId The identifier of the Install to get the associated Connector
   * @returns {Promise<any>} Authenticated SDK you would use to interact with the Connector service
   * on behalf of your user
   * @example
   * router.post('/api/:connectorName', async (ctx) => {
   *    const client = await integration.service.getSdk(ctx, ctx.params.connectorName, ctx.req.body.instanceIds[0]);
   *    // use client methods . . .
   * });
   */
  public getSdk = (ctx: FusebitContext, connectorName: string, installId: string) => {
    return ctx.state.manager.connectors.getByName(ctx, connectorName, installId);
  };

  /**
   * Get an authenticated SDK for each Connector in the list, using a given Install.
   * @param ctx The context object provided by the route function
   * @param {string[]} connectorNames An array of Connector names
   * @param {string} installId The identifier of the Install to get the associated Connectors
   * @returns {Promise<any[]>} Array of official Connector SDK instances already
   * authorized with the proper credentials
   * @example
   * router.post('/api/components', async (ctx) => {
   *    const clients = await integration.service.getSdks(ctx, ['mySlackConnector', 'myHubSpotConnector'], ctx.req.body.instanceIds[0]);
   *    for await (const sdk of  clients) {
   *        // Access sdk methods here . . .
   *    }
   * });
   */
  public getSdks = (ctx: FusebitContext, connectorNames: string[], installId: string) => {
    return connectorNames.map((connectorName) => this.getSdk(ctx, connectorName, installId));
  };

  /**
   * Get a configured Integration with a set of identities and other values that represent
   * a single user of the Integration.
   * Read more: https://developer.fusebit.io/docs/fusebit-system-architecture#installation-lifecycle
   * @param ctx The context object provided by the route function
   * @param {string} installId
   * @example
   * router.post('/api/test', async (ctx) => {
   *    const client = await integration.service.getInstall(ctx, ctx.req.body.installIds[0]);
   *    // use client methods . . .
   * });
   */
  public getInstall = async (ctx: FusebitContext, installId: string): Promise<EntityBase.Types.IInstall> => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/install/${installId}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;
    return body;
  };
}

/**
 * @class
 * @alias integration.tenant
 */
class Tenant {
  /**
   * @private
   */
  public service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  /**
   * Get an authenticated SDK for each Connector in the list, using a given Tenant ID
   * @param ctx The context object provided by the route function
   * @param {string} connectorName The name of the Connector from the service to interact with
   * @param {string} tenantId Represents a single user of this Integration,
   * usually corresponding to a user or account in your own system
   * @returns {Promise<any>} Authenticated SDK you would use to interact with the
   * Connector service on behalf of your user
   * @example
   * router.post('/api/:connectorName/:tenant', async (ctx) => {
   *    const client = await integration.service.getSdkByTenant(ctx, ctx.params.connectorName, ctx.params.tenant);
   *    // use client methods . . .
   * });
   */
  public getSdkByTenant = async (ctx: FusebitContext, connectorName: string, tenantId: string) => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/install?tag=${TENANT_TAG_NAME}=${encodeURIComponent(tenantId)}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;

    if (body.items.length === 0) {
      ctx.throw(404, `Cannot find an Integration Install associated with tenant ${tenantId}`);
    }

    if (body.items.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tenant ${tenantId}`);
    }

    return this.service.getSdk(ctx, connectorName, body.items[0].id);
  };

  public getSdkByTag = async (ctx: FusebitContext, connectorName: string, tag: string, tagValue: string) => {
    const response = await superagent
      .get(`${ctx.state.params.baseUrl}/install?tag=${tag}=${encodeURIComponent(tagValue)}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);
    const body = response.body;

    if (body.items.length === 0) {
      ctx.throw(404, `Cannot find an Integration Install associated with tag ${tag} and value ${tagValue}`);
    }

    if (body.items.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tag ${tag} and value ${tagValue}`);
    }

    return this.service.getSdk(ctx, connectorName, body.items[0].id);
  };
}

/**
 * Integration
 * @namespace
 */
namespace Integration {
  /**
   * Types
   * @namespace
   */
  export namespace Types {
    export type Context = EntityBase.Types.Context;
    export type EventContext = EntityBase.Types.EventContext;
    export type CronContext = EntityBase.Types.CronContext;
    export type Next = EntityBase.Types.Next;
    export interface IOnStartup extends EntityBase.Types.IOnStartup {}
    export interface IInstall extends EntityBase.Types.IInstall {}
  }
}
/**
 * @class Integration
 * @description Access to our SDK capabilities, like Storage, Authorization middlewares, SDK clients.
 * @augments EntityBase
 * @private
 *
 */
export default class Integration extends EntityBase {
  /**
   * @memberof Service
   * @private
   */
  public service = new Service();
  /**
   * @memberof Middleware
   * @private
   */
  public middleware = new Middleware();
  /**
   * @private
   */
  public storage = new EntityBase.StorageDefault();
  /**
   * @memberof Tenant
   * @private
   */
  public tenant = new Tenant(this.service);
  /**
   * @memberof ResponseDefault
   * @private
   */
  public response = new EntityBase.ResponseDefault();
}
