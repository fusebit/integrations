const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'gongConnector';

// Test Endpoint: Get all users stored in the Gong account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const gongClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const users = await gongClient.get('/v2/users');

  ctx.body = {
    message: `Successfully loaded ${users.users.length} users from Gong`,
  };
});

module.exports = integration;
