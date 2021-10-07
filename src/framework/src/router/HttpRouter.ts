import { FusebitContext, FusebitRouter, Next } from './Common';

export type HttpContext = FusebitContext;
export type HttpHandler = (ctx: HttpContext, next: Next) => ReturnType<Next>;

/**
 *
 * HttpRouter extends the pattern defined by a Koa.Router, and supports all of the usual HTTP verbs.
 * As such, an integration can create a handler on an arbitrary URL endpoint in a simple fashion.
 *
 * Note: This object follows the pattern established originally in Express and extended by Koa.
 *
 * {@link https://koajs.com Use the koa documentation as a reference }
 *
 * @alias integration.router
 * @augments FusebitRouter
 *
 * @example
 *
 *    router.get('/hello', async (ctx) => { ctx.body = 'Hello World'; });
 */
export class HttpRouter extends FusebitRouter {}
