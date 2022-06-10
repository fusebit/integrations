const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'outreachConnector';

// Test endpoint: Get details on the current user.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const outreachClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://api.outreach.io/api/v2/docs
  const accounts = await outreachClient.get('/accounts');

  ctx.body = {
    message: `Listed ${accounts.data.length} accounts in the system.`,
  };
});

// Endpoint for Sample App: Retrieve a list of accounts from Outreach
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const outreachClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Include API Reference for Outreach
  const accounts = await outreachClient.get('/accounts');

  ctx.body = accounts.map((account) => ({
    id: account.id,
    name: account.name,
  }));
});

module.exports = integration;
