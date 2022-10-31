const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'driftConnector';

// Test Endpoint: Get all accounts stored in the Drift account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const driftClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://devdocs.drift.com/docs
  const accounts = await driftClient.get('/accounts');

  ctx.body = {
    message: `Successfully loaded ${accounts.data.accounts.length} contacts from Drift`,
  };
});

module.exports = integration;
