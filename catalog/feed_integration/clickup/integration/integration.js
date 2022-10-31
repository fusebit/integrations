const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'clickupConnector';

// Test Endpoint: Get all teams the ClickUp account is associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const clickupClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://clickup.com/api/
  const teams = await clickupClient.get('/team');

  ctx.body = {
    message: `Successfully discovered ${teams.teams.length} teams`,
  };
});

module.exports = integration;
