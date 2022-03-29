const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'zoomConnector';

// Test Endpoint: Get all contacts stored in the Zoom account associated with your tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const zoomClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods
  const me = await zoomClient.get('/users/me');
  const meetings = await zoomClient.get('/users/me/meetings');

  ctx.body = {
    message: `Success! ${me.first_name} ${me.last_name} has ${meetings.total_records} meetings scheduled.`,
  };
});

module.exports = integration;
