const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'pagerdutyConnector';

// Test Endpoint: Get list of services in the PagerDuty account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/PagerDuty/pdjs
  const services = await pagerdutyClient.get('/services');

  ctx.body = {
    message: `Success! Identified ${services.data.services.length} services in PagerDuty.`,
  };
});

// Endpoint for Sample App: Retrieve Incident Title and URL from PagerDuty
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const incidents = await pagerdutyClient.get('/incidents');

  const incidentList = incidents.resource.map((incident) => ({
    incedentTitle: incident.title,
    affectedService: incident.service.summary,
  }));

  ctx.body = incidentList;
});

module.exports = integration;
