/* XXX
 *  - Right now /foo and /foo/ do not get resolved to the same handler; fix.
 *  - Body needs to be added to the type under ctx.req or ctx.request.
 */
import Koa from 'koa';

import KoaRouter from '@koa/router';

import { Manager } from './Manager';

import { IncomingMessage } from 'http';

const httpMethods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
const fusebitMethods = ['CRON', 'EVENT'];

/**
 * Router
 *
 * Router extends the pattern defined by a Koa.Router, and supports all of the usual HTTP verbs. As such, an
 * integration can create a handler on an arbitrary URL endpoint in a simple fashion:
 *   router.get('/hello', async (ctx) => { ctx.body = 'Hello World'; });
 *
 * This object follows the pattern established originally in Express and extended by Koa. The documentation at
 * `https://koajs.com` can be used as a reference.
 */
class Router extends KoaRouter {
  public manager?: Manager;

  /** Create a new Router. */
  constructor() {
    super({ methods: [...httpMethods, ...fusebitMethods] });
  }

  /**
   * Cron events get to be named (the 'path' parameter) in the fusebit.json object with a particular schedule.
   * On execution, they get mapped to particular handlers declared via `.cron(name, ...)`.
   *
   * The response is discarded, outside of analytics and event reporting.
   *
   * @param name the name of the cron schedule
   * @param middleware handle the Koa request
   */
  public cron(name: string, ...middleware: any[]) {
    this.register(name, ['cron'], middleware, { name });
  }

  /**
   * Register for an event.
   *
   * Each event is invoked with the set of parameters as an object in the first parameter, followed by an
   * optional next parameter for event chaining support.
   */
  public on(path: any, ...middleware: any[]) {
    this.register(
      path,
      ['event'],
      // Use the parameters instead of the ctx as the first parameter, and save the result in the ctx.body
      middleware.map((m) => async (ctx: KoaRouter.RouterContext, next: Koa.Next) => {
        ctx.body = await m((ctx as Context).event.parameters, next);
      }),
      { name: path }
    );
  }

  /*
  // Typescript yells at me without these... I don't know why.
  public get(path: any, ...middleware: any[]): Router {
    return super.get(path, ...middleware) as Router;
  }
  public delete(path: any, ...middleware: any[]): Router {
    return super.delete(path, ...middleware) as Router;
  }
 */
}
/** Elements that get added to the stock Koa context. */
export interface IContext {
  /** The parameters for an event invocation. */
  event?: any; // Optional to keep typescript from yelling.

  /** Special context provided by Fusebit. */
  fusebit?: any; // Optional to keep typescript from yelling.

  /** Add `body` to the req. */
  req: IncomingMessage & { body?: any };
}

/** The general purpose type for ctx parameters on routes and events. */
type Context = KoaRouter.RouterContext & IContext;

/** The type of the next parameter on routes and event handlers. */
type Next = Koa.Next;

export { Router, Context, Next };
