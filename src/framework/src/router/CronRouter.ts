import { FusebitContext, FusebitRouter, Next } from './Common';

export type CronContext = FusebitContext;
export type CronHandler = (ctx: CronContext, next: Next) => ReturnType<Next>;
type CronRegistrationArray = [CronHandler | string, ...CronHandler[]];

const isString = (entry: CronHandler | string): entry is string => {
  return typeof entry === 'string';
};

/**
 * A CronRouter extends the normal HTTP-style router to enable capturing specific events generated
 * through a cron trigger, as specified in the fusebit.json of the entity.
 */
export class CronRouter {
  private readonly router: FusebitRouter;

  /**
   * @private
   */
  constructor(baseRouter: FusebitRouter) {
    this.router = baseRouter;
  }

  /**
   * Cron events get to be named (the 'path' parameter) in the fusebit.json object
   * with a particular schedule.
   *
   * On execution, they get mapped to particular handlers declared via `.cron(name, ...)`.
   * The response is discarded, outside of analytics and event reporting.
   *
   * @name CronRouter.on
   * @param {string} name the name of the cron schedule
   * @param {any} middleware Koa request handler
   */
  public on(...middleware: CronRegistrationArray) {
    if (isString(middleware[0])) {
      this.router.register(middleware[0], ['cron'], middleware.slice(1) as CronHandler[], { name: middleware[0] });
    } else {
      this.router.register('(.*)', ['cron'], middleware as CronHandler[], { name: 'cron-wildcard' });
    }
  }
}
