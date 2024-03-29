import Koa from 'koa';

import KoaRouter from '@koa/router';

import { IncomingMessage } from 'http';

const httpMethods = ['HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'];
const fusebitMethods = ['CRON', 'EVENT', 'TASK'];

/** Elements that get added to the stock Koa context. */
export interface IFusebitContext extends KoaRouter.RouterContext {
  /** Special context provided by Fusebit. */
  fusebit?: any; // Optional to keep TypeScript from yelling.

  /** Add `body` to the req. */
  req: IncomingMessage & { body?: any };
}

/**
 * The general purpose type for ctx parameters on routes and events.
 */
export type FusebitContext = IFusebitContext;

/** The type of the next parameter on routes and event handlers. */
export type Next = Koa.Next;

/** The type of a Koa-style handler function in Fusebit. */
export type FusebitHandler = (ctx: FusebitContext, next: Next) => ReturnType<Next>;

/**
 * The FusebitRouter is exposed as an HttpRouter on an entity.
 * @augments KoaRouter
 */
export class FusebitRouter extends KoaRouter {
  constructor() {
    super({ methods: [...httpMethods, ...fusebitMethods] });
  }
}
