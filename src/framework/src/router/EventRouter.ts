import { FusebitContext, FusebitHandler, FusebitRouter, Next } from './Common';

export interface EventContext extends FusebitContext {
  event: {
    eventType: string;
    eventSourceId: string;
    eventSourceType: string;
  };
}
export type EventHandler = (ctx: EventContext, next: Next) => ReturnType<Next>;

/**
 *
 * An EventRouter is used to capture events coming from both internal components as well as external
 * components, such as WebHook events from a connector.
 */
export class EventRouter {
  private readonly router: FusebitRouter;

  constructor(baseRouter: FusebitRouter) {
    this.router = baseRouter;
  }

  /**
   * Register for an event.
   *
   * Each event is invoked with the set of parameters as an object in the first parameter, followed by an
   * optional next parameter for event chaining support.
   * @name EventRouter.on
   * @param {string} path
   * @param {EventHandler[]} middleware
   */
  public on(path: string, ...middleware: EventHandler[]) {
    this.router.register(path, ['event'], middleware as FusebitHandler[], { name: path });
  }
}
