const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'procoreConnector';

// Test Endpoint: Get all companies stored in the Procore account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const procoreClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developers.procore.com/reference/rest/v1/companies?version=1.0
  const companies = await procoreClient.get('/companies', { include_free_companies: true });

  ctx.body = {
    message: `Successfully loaded ${companies.length} companies from your Procore account`,
  };
});

module.exports = integration;
