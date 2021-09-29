import Koa from 'koa';

import KoaRouter from '@koa/router';

import { IncomingMessage } from 'http';

const httpMethods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
const fusebitMethods = ['CRON', 'EVENT'];

/** Elements that get added to the stock Koa context. */
export interface IFusebitContext extends KoaRouter.RouterContext {
  /** Special context provided by Fusebit. */
  fusebit?: any; // Optional to keep typescript from yelling.

  /** Add `body` to the req. */
  req: IncomingMessage & { body?: any };
}

/** The general purpose type for ctx parameters on routes and events. */
export type FusebitContext = IFusebitContext;

/** The type of the next parameter on routes and event handlers. */
export type Next = Koa.Next;

export type FusebitHandler = (ctx: FusebitContext, next: Next) => ReturnType<Next>;

/**
 * FusebitRouter
 */
export class FusebitRouter extends KoaRouter {
  constructor() {
    super({ methods: [...httpMethods, ...fusebitMethods] });
  }
}
