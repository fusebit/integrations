import { Router, Context, Next } from './Router';
import { Manager, IOnStartup } from './Manager';
import { IInstanceConnectorConfig } from './ConnectorManager';
import Connector from './client/Connector';

const router = new Router();

/**
 * Annotate the health status with information on whether the vendor code loaded correctly.
 */
router.get('/api/health', async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
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

router.post('/event/:eventMode', async (ctx: Context, next: Next) => {
  // sent event name is of format `/<componentName>/<eventType>`

  if (ctx.params.eventMode === 'lifecycle') {
    ctx.throw(400, 'Lifecycle events should not be created via the `/event` endpoint');
  }

  // Would be nice to have Joi here...
  if (typeof ctx.req?.body?.payload !== 'object' || typeof ctx.req.body.payload.length !== 'number') {
    ctx.throw(400, `Missing events: ${JSON.stringify(ctx.req.body)}`);
  }

  const events = ctx.req.body.payload as Connector.Types.IWebhookEvents;

  // Assume all of the events are from the same connector
  const component = ctx.state.manager.config.components.find(
    (comp: IInstanceConnectorConfig) => comp.entityId === events[0].entityId
  );

  if (!component) {
    ctx.throw(
      418,
      `No component found: ${JSON.stringify(events)} ${events[0].entityId} ${JSON.stringify(
        ctx.state.manager.config.components.map((c: any) => c.entityId)
      )}`
    );
  }

  const result = await Promise.all(
    events.map(async (event: Connector.Types.IWebhookEvent) => {
      const eventName = `/${component.name}/${ctx.params.eventMode}/${event.eventType}`;
      return ctx.state.manager.invoke(eventName, event, ctx.state);
    })
  );
  ctx.body = result;
});

export default router;
