/* tslint:disable:max-classes-per-file no-empty-interface no-namespace */
import EntityBase from './EntityBase';
import { FusebitContext } from '../router';
import { WebhookClient as _WebhookClient, IFusebitCredentials as _IFusebitCredentials } from '../provider';
import superagent from 'superagent';

/**
 * Webhook utilities that give you access to Webhook client SDKs
 * @class
 * @alias integration.webhook
 */
class Webhook extends EntityBase.WebhookBase {
  public WEBHOOK_PREFIX = 'webhook';

  /**
   * Get an authenticated Webhook SDK for each Connector in the list, using a given Tenant ID
   * @param ctx The context object provided by the route function
   * @param {string} connectorName The name of the Connector from the service to interact with
   * @param {string} tenantId Represents a single user of this Integration,
   * usually corresponding to a user or account in your own system
   * @returns {Promise<any>} Authenticated SDK you would use to interact with the
   * Connector service on behalf of your user.
   * @example
   * router.post('/api/:connectorName/:tenant', async (ctx) => {
   *    const webhookClient = await integration.webhook.getSdkByTenant(ctx, ctx.params.connectorName, ctx.params.tenant);
   *    // use client methods . . .
   * });
   */
  public getSdkByTenant = async (
    ctx: FusebitContext,
    connectorName: string,
    tenantId: string
  ): Promise<Integration.Types.WebhookClient> => {
    const installs = await this.utilities.getTenantInstalls(ctx, tenantId);

    if (!installs || !installs.length) {
      ctx.throw(404, `Cannot find an Integration Install associated with tenant ${tenantId}`);
    }

    if (installs.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tenant ${tenantId}`);
    }

    return this.getSdk(ctx, connectorName, installs[0].id);
  };

  /**
   * Get an authenticated Webhook SDK for each Connector in the list, using a given Tenant ID
   * @param ctx The context object provided by the route function
   * @param {string} connectorName The name of the Connector from the service to interact with
   * @param {string} installId Represents a single installation of this Integration
   * @returns {Promise<any>} Authenticated SDK you would use to interact with the
   * Connector service on behalf of your user.
   * @example
   * router.post('/api/:connectorName/:installId', async (ctx) => {
   *    const webhookClient = await integration.webhook.getSdk(ctx, ctx.params.connectorName, ctx.params.installId);
   *    // use client methods . . .
   * });
   */
  public getSdk = async (
    ctx: FusebitContext,
    connectorName: string,
    installId: string
  ): Promise<Integration.Types.WebhookClient> => {
    return ctx.state.manager.connectors.getWebhookClientByName(ctx, connectorName, installId);
  };

  public getSdkByTags = async (
    ctx: FusebitContext,
    connectorName: string,
    tags: Record<string, string>
  ): Promise<Integration.Types.WebhookClient> => {
    const installs = await this.utilities.listByTags(ctx, 'install', tags, this.WEBHOOK_PREFIX);

    if (!installs || !installs.length) {
      ctx.throw(404, `Cannot find an Integration Install associated with tags ${JSON.stringify(tags)}`);
    }

    if (installs.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tags ${JSON.stringify(tags)}`);
    }

    return this.getSdk(ctx, connectorName, installs[0].id);
  };
}

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
  public getSdk = (ctx: FusebitContext, connectorName: string, installId?: string) => {
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
    return response.body;
  };

  /**
   * List all Integration Installs, or only Installs that match a particular tag with an optional value.
   * @param ctx The context object provided by the route function
   * @param {string} [tagKey]
   * @param {string} [tagValue]
   * @example
   * router.post('/api/test', async (ctx) => {
   *    const installs = await integration.service.listInstalls(ctx, 'serviceTag');
   *    const client = await integration.service.getSdk(ctx, connectorName, installs[0].id);
   *    // use the client . . .
   * });
   */
  public listInstalls = async (
    ctx: FusebitContext,
    tagKey?: string,
    tagValue?: string
  ): Promise<EntityBase.Types.IInstall[]> => {
    return this.utilities.listByTag(ctx, 'install', tagKey, tagValue);
  };

  public listInstallsByTags = async (
    ctx: FusebitContext,
    tags: Record<string, string>
  ): Promise<EntityBase.Types.IInstall[]> => {
    const installs = await this.utilities.listByTags(ctx, 'install', tags);

    if (!installs || !installs.length) {
      ctx.throw(404, `Cannot find an Integration Install associated with tags ${JSON.stringify(tags)}`);
    }

    return installs;
  };
}

/**
 * Tenant utilities that give you access to Connector client SDKs.
 * A Tenant represents a single user of an Integration, usually corresponding to a user or account in your own system.
 * Read more: {@link https://developer.fusebit.io/docs/integration-programming-model#fusebit-tenancy-model}
 * @class
 * @alias integration.tenant
 */
class Tenant extends EntityBase.TenantBase {
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
   *    const client = await integration.tenant.getSdkByTenant(ctx, ctx.params.connectorName, ctx.params.tenant);
   *    // use client methods . . .
   * });
   */
  public getSdkByTenant = async (ctx: FusebitContext, connectorName: string, tenantId: string) => {
    const installs = await this.utilities.getTenantInstalls(ctx, tenantId);

    if (installs.length === 0) {
      ctx.throw(404, `Cannot find an Integration Install associated with tenant ${tenantId}`);
    }

    if (installs.length > 1) {
      ctx.throw(400, `Too many Integration Installs found with tenant ${tenantId}`);
    }
    return this.utilities.getConnectorSdkByName(ctx, connectorName, installs[0].id);
  };
  /**
   * Get a list of Integration Installs associated with a given Tenant
   * @param ctx The context object provided by the route function
   * @param {string} tenantId Represents a single user of this Integration,
   * usually corresponding to a user or account in your own system
   * @returns {Promise<EntityBase.IInstall[]>} An array of Installs
   * @example
   * router.post('/api/:tenant', async (ctx) => {
   *    const installs = await integration.service.getTenantInstalls(ctx, ctx.params.tenant);
   * });
   */
  public getTenantInstalls = async (ctx: FusebitContext, tenantId: string) =>
    this.utilities.getTenantInstalls(ctx, tenantId);
}

type _Service = Service;
type _Webhook = Webhook;

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
    export type Response = EntityBase.ResponseDefault;
    export type Middleware = EntityBase.MiddlewareDefault;
    export type Storage = EntityBase.StorageDefault;
    export type Service = _Service;
    export type Webhook = _Webhook;
    export type WebhookClient = _WebhookClient;
    export type IFusebitCredentials = _IFusebitCredentials;
  }
}

/**
 * @class Integration
 * @description Access to our SDK capabilities, like Storage, Authorization middlewares, SDK clients.
 * @augments EntityBase
 * @private
 *
 */
class Integration extends EntityBase {
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
  public tenant = new Tenant();
  /**
   * @memberof ResponseDefault
   * @private
   */
  public response = new EntityBase.ResponseDefault();

  /**
   * @private
   */
  public webhook: Webhook = new Webhook();
}

export default Integration;
