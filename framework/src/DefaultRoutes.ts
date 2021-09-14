import { Router, Context, Next } from './Router';
import { Manager, IOnStartup } from './Manager';
import { IInstanceConnectorConfig } from './ConnectorManager';

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

router.post('/event/:eventMode/:sourceEntityId/:eventType(.*)', async (ctx: Context, next: Next) => {
  // sent event name is of format `/<componentName>/<eventType>`

  if (ctx.params.eventMode === 'lifecycle') {
    ctx.throw(400, 'Lifecycle events should not be created via the `/event` endpoint');
  }

  const component = ctx.state.manager.config.components.find(
    (component: IInstanceConnectorConfig) => component.entityId === ctx.params.sourceEntityId
  );
  if (!component) {
    return;
  }
  const eventName = `/${component.name}/${ctx.params.eventType}`;
  const result = await ctx.state.manager.invoke(eventName, ctx.req.body, ctx.state);
  ctx.body = result;
});

export default router;
