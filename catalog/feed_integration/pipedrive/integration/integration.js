const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'pipedriveConnector';

// Test Endpoint: Get all leads stored in the Pipedrive account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const pipedriveClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developers.pipedrive.com/docs/api/v1
  const deals = await pipedriveClient.get('/v1/deals');
  ctx.body = {
    message: `Successfully loaded ${deals.data.length} deals from Pipedrive.`,
  };
});

// Endpoint for Sample App: Retrieve a list of leads from Pipedrive
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const pipedriveClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const leads = await pipedriveClient.get('/v1/leads');

  ctx.body = leads.data.map((lead) => lead.title);
});

// Endpoint for Sample App: Create a new lead in Pipedrive
router.post('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const pipedriveClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Create a new lead
  await pipedriveClient.post('/v1/leads', {
    title: ctx.req.body.title,
    organization_id: ctx.req.body.organization_id,
  });
});

module.exports = integration;
