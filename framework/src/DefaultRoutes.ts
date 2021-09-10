import { Router, Context, Next } from './Router';
import { Manager, IOnStartup } from './Manager';

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

router.post('/event', async (ctx: Context, next: Next) => {
  const result = await ctx.state.manager.invoke(ctx.req.body.event, ctx.req.body.parameters);
  ctx.body = result;
});

export default router;
