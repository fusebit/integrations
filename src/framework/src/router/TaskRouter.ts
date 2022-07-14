import { FusebitContext, FusebitRouter, Next } from './Common';

export type TaskContext = FusebitContext;
export type TaskHandler = (ctx: TaskContext, next: Next) => ReturnType<Next>;

/**
 *
 * TaskRouter extends the pattern defined by a Koa.Router, and supports the TASK verb.
 *
 * Note: This object follows the pattern established originally in Express and extended by Koa.
 *
 * {@link https://koajs.com Use the koa documentation as a reference }
 *
 * @example
 *
 *    integration.task.on('/api/hello', async (ctx) => { ctx.body = 'Hello World'; });
 */
export class TaskRouter {
  private readonly router: FusebitRouter;

  constructor(baseRouter: FusebitRouter) {
    this.router = baseRouter;
  }

  /**
   * Register to handle a scheduled task.
   *
   * A task is equivilent in many respects to a normal HTTP invocation, except that it appears to be
   * asynchronous from the perspective of the caller and may take more than a minute to complete.
   *
   * The contents of `ctx.body` will be made available to the caller after the invocation completes.
   *
   * @name TaskRouter.on
   * @param {string} path
   * @param {TaskHandler[]} middleware
   */
  public on(path: string, ...middleware: TaskHandler[]) {
    if (path[0] !== '/') {
      console.log(`WARNING: Missing leading '/' on path: ${path}`);
    }
    this.router.register(path, ['task'], middleware as TaskHandler[], { name: path });
  }
}
