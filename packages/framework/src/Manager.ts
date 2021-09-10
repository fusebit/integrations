import util from 'util';
import Koa from 'koa';

import statuses from 'statuses';

import httpMocks from 'node-mocks-http';

import { Router, Context } from './Router';

import { ConnectorManager, IInstanceConnectorConfig } from './ConnectorManager';

import DefaultRoutes from './DefaultRoutes';

/** The vendor module failed to load with this error */
type VendorModuleError = any;

/** The Manager will handle either integration or connector configurations. */
interface IConfig {
  handler: string;
  components?: IInstanceConnectorConfig[];
  configuration: any;
  mountUrl: string;
  schedule: {
    cron: string;
    timezone: string;
    endpoint: string;
  }[];
}

/** The internal Fusebit request context. passed in through the lambda. */
type RequestContext = any;

/** Parameters supplied for an internal event invocation. */
type InvokeParameters = any;

/** Placeholder interface for accessing storage. */
interface IStorage {
  accessToken: string;
  get: (key: string) => Promise<any>;
  put: (data: any, key: string) => Promise<void>;
  delete: (key: string | undefined, flag?: boolean) => Promise<void>;
}

/** Type for the OnStartup event parameters. */
interface IOnStartup {
  router: Router;
  mgr: Manager;
  cfg: IConfig;
}

/**
 * Manager
 *
 * The Manager class is responsible for setting up both integration and connector instances within a Fusebit
 * environment.  It sets up the routing tables and event hooking system.
 *
 * The Manager is created by Fusebit, and is not usually invoked directly by an integration except when it's
 * necessary to invoke specific events.
 */
class Manager {
  /** @private Error cached from vendor code. */
  public vendorError: any;

  /** @private Used for context creation. */
  public app: Koa;

  /** @private Route requests and events to specific endpoint handlers. */
  public router: Router;

  /** @public Store the configuration as passed in for other consumers. */
  public config!: IConfig;

  /** @public Connectors attached to this integration. */
  public connectors: ConnectorManager;

  /** Create a new Manager, using the supplied storage interface as a persistance backend. */
  constructor() {
    this.app = new Koa();
    this.router = new Router();
    this.connectors = new ConnectorManager();
  }

  /** Configure the Manager with the vendor object and error, if any. */
  public setup(cfg: IConfig, vendor?: Router, vendorError?: VendorModuleError) {
    this.config = cfg;

    // Load the configuration for the integrations
    this.connectors.setup(cfg.components);

    if (vendorError) {
      this.vendorError = vendorError;
    }

    // Add vendor routes prior to the defaults, to allow for the vendor to add middleware or override default
    // handlers.
    if (vendor) {
      try {
        this.router.use(vendor.routes());
      } catch (err) {
        this.vendorError = this.vendorError || err;
      }
    }

    // Add the default routes - these will get overruled by any routes added by the vendor or during the
    // startup phase.
    this.router.use(DefaultRoutes.routes());

    // Give everything a chance to be initialized - normally, the cfg object would be specialized per router
    // object to allow for routers to have specialized configuration elements, but we will sort that out
    // later.
    this.invoke('startup', { mgr: this, cfg, router: this.router });
  }

  /**
   * Accept a Fusebit event, convert it into a routable context, and execute it through the router.
   * @return the response, in Fusebit format, from executing this event.
   */
  public async handle(fusebitCtx: RequestContext) {
    // Convert the context and execute.
    const ctx = this.createRouteableContext(fusebitCtx);
    await this.execute(ctx);
    return this.createResponse(ctx);
  }

  /**
   * Used to call, RPC style, an event function mounted via `.on()`
   * @param event The name of the event to invoke.
   * @param parameters: The set of parameters the event is expecting.
   * @return the body of the response.
   */
  public async invoke(event: string, parameters: InvokeParameters) {
    const ctx = this.createRouteableContext({
      method: 'EVENT',
      path: event,
      request: { body: {}, rawBody: '', params: {} },
    });
    ctx.event = { parameters: { ...parameters, ctx } };
    await this.execute(ctx);
    return ctx.body;
  }

  /**
   * Execute a Koa-like context through the Router, and return the payload.
   * @param ctx A Koa-like context
   */
  protected async execute(ctx: Context) {
    return new Promise(async (resolve) => {
      try {
        const { request } = ctx;
        if (request.method === 'CRON') {
          ctx.url = this.config.schedule[0].endpoint;
        }

        // TODO: Need to supply a next, but not sure if it's ever invoked.  Worth looking at the Koa impl at some point.
        await this.router.routes()(ctx as any, resolve as Koa.Next);

        // Peak into the ctx; if it's unserved, throw a 404.
        if (!(ctx as any).routerPath) {
          ctx.throw(404);
        }
      } catch (e) {
        if (e.status !== 404) {
          console.log(`Manager::execute error: ${require('util').inspect(e)}`);
        }
        e.expose = true;
        this.onError(ctx, e);
      }

      // Extract any data from the response, and specify that in the body.
      const data = (ctx.res as any)._getData();
      if (data) {
        ctx.body = data;
      }
      resolve();
    });
  }

  /** Derived from the Koa.context.onerror implementation - do intelligent things when errors happen. */
  protected onError(ctx: Context, err: any) {
    if (err == null) {
      return;
    }

    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError = Object.prototype.toString.call(err) === '[object Error]' || err instanceof Error;
    if (!isNativeError) {
      err = new Error(util.format('non-error thrown: %j', err));
    }

    const { res } = ctx;

    // Set only the headers specified in the error.
    res.getHeaderNames().forEach((name) => res.removeHeader(name));
    ctx.set(err.headers);

    // force text/plain
    ctx.type = 'text';

    let statusCode = err.status || err.statusCode;

    // ENOENT support
    if (err.code === 'ENOENT') {
      statusCode = 404;
    }

    // default to 500
    if (typeof statusCode !== 'number' || !statuses(statusCode)) {
      statusCode = 500;
    }

    // respond
    const message = err.expose ? err.message : `${statusCode}`;
    ctx.status = err.status = statusCode;
    ctx.length = Buffer.byteLength(message);
    ctx.body = { status: err.status, message };
  }

  /** Convert from a Fusebit function context into a routable context. */
  public createRouteableContext(fusebitCtx: RequestContext): Context {
    const req = httpMocks.createRequest({
      url: fusebitCtx.path,
      method: fusebitCtx.method,
      headers: fusebitCtx.headers,
      body: fusebitCtx.body,
    });

    const res = httpMocks.createResponse();

    const ctx = this.app.createContext(req, res) as any;

    // Promote several fusebitCtx members directly into the ctx
    //
    // NOTE: this may glitch non-utf-8 encodings; for blame, see koa/lib/request.js's casual use of stringify.
    ctx.query = fusebitCtx.query;

    // TODO: These parameters need a review and some intent.
    ctx.state.params = {
      accountId: fusebitCtx.accountId,
      subscriptionId: fusebitCtx.subscriptionId,
      entityType: fusebitCtx.boundaryId,
      entityId: fusebitCtx.functionId,
      storageIdPrefix: `/${fusebitCtx.boundaryId}/${fusebitCtx.functionId}`,
      ...(fusebitCtx.fusebit // Not present during initial startup events, for example.
        ? {
            endpoint: fusebitCtx.fusebit.endpoint,
            baseUrl: `${fusebitCtx.fusebit.endpoint}/v2/account/${fusebitCtx.accountId}/subscription/${fusebitCtx.subscriptionId}/${fusebitCtx.boundaryId}/${fusebitCtx.functionId}`,
            resourcePath: `/account/${fusebitCtx.accountId}/subscription/${fusebitCtx.subscriptionId}/${fusebitCtx.boundaryId}/${fusebitCtx.functionId}${fusebitCtx.path}`,
            functionAccessToken: fusebitCtx.fusebit.functionAccessToken,
          }
        : {}),
    };
    ctx.state.fusebit = { ...fusebitCtx.fusebit, caller: fusebitCtx.caller };
    ctx.state.manager = this;

    // Pre-load the status as OK
    ctx.status = 200;

    return ctx;
  }

  /** Convert the routable context into a response that the Fusebit function expects. */
  public createResponse(ctx: Context) {
    const result = {
      body: ctx.body,
      headers: ctx.response.header,
      status: ctx.status,
      ...(typeof ctx.body === 'string' ? { bodyEncoding: 'utf8' } : {}),
    };

    return result;
  }
}

export { Manager, IStorage, IOnStartup };
