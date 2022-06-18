const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'pipedriveConnector';

// Test Endpoint: Get all contacts stored in the Pipedrive account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const pipedriveClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developers.pipedrive.com/docs/api/v1
  const deals = await pipedriveClient.get('/v1/deals');
  ctx.body = {
    message: `Successfully loaded ${deals.data.length} deals from Pipedrive.`,
  };
});

module.exports = integration;
