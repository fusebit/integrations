import { HttpRouter, EventRouter, FusebitContext, Next } from './router';
import { IInstanceConnectorConfig } from './ConnectorManager';
import Connector from './client/Connector';

import { validate } from './middleware';
import { schema as eventSchema } from './validation/event';

const router = new HttpRouter();
const eventRouter = new EventRouter(router);

/**
 * Annotate the health status with information on whether the vendor code loaded correctly.
 */
router.get('/api/health', async (ctx: FusebitContext, next: Next) => {
  try {
    await next();
  } catch (error) {
    const err: { message: string } = error as any;
    return ctx.throw(501, `Failed internal health check: ${err.message}`);
  }

  // If no status has been set, respond with a basic one.
  if (ctx.status === 200 && ctx.state.manager.vendorError) {
    // TODO: The ctx.throw doesn't seem to support an optional parameter, or it gets stripped out later.
    ctx.body = ctx.throw(501, `invalid code: ${ctx.state.manager.vendorError}`, {
      backtrace: ctx.state.manager.vendorError.stack,
    });
  } else {
    ctx.body = {
      status: 'ok',
    };
  }
});

router.post('/event/:eventMode', validate(eventSchema), async (ctx: FusebitContext) => {
  // sent event name is of format `/<componentName>/<eventType>`
  const events = ctx.req.body.payload as Connector.Types.IWebhookEvents;

  const component = ctx.state.manager.config.components.find(
    (comp: IInstanceConnectorConfig) => comp.entityId === events[0].entityId
  );

  if (!component) {
    ctx.throw(
      418,
      `No component found: ${JSON.stringify(events)} ${events[0].entityId} ${JSON.stringify(
        ctx.state.manager.config.components.map((comp: IInstanceConnectorConfig) => comp.entityId)
      )}`
    );
  }

  const result = await Promise.all(
    events.map(async (event: Connector.Types.IWebhookEvent) => {
      const eventName = `/${component.name}/${ctx.params.eventMode}/${event.eventType}`;
      const returnVal = await ctx.state.manager.invoke(eventName, event, ctx.state);
      return returnVal ? returnVal : { status: 200, message: 'ok' };
    })
  );

  // The invoke call cloaks any exceptions created; promote the highest status code into this request, and log
  // the message for reference.
  result.forEach((invocation) => {
    if (ctx.status < invocation.status) {
      ctx.status = invocation.status;
    }
  });

  ctx.body = result;
});

eventRouter.on('/lifecycle/startup', async (ctx, next) => next());

export default router;
