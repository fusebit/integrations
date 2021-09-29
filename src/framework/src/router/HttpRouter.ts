import { FusebitContext, FusebitRouter, Next } from './Common';

export type HttpContext = FusebitContext;
export type HttpHandler = (ctx: HttpContext, next: Next) => ReturnType<Next>;

/**
 * HttpRouter
 *
 * HttpRouter extends the pattern defined by a Koa.Router, and supports all of the usual HTTP verbs. As such, an
 * integration can create a handler on an arbitrary URL endpoint in a simple fashion:
 *   router.get('/hello', async (ctx) => { ctx.body = 'Hello World'; });
 *
 * This object follows the pattern established originally in Express and extended by Koa. The documentation at
 * `https://koajs.com` can be used as a reference.
 */
export class HttpRouter extends FusebitRouter {}
