// Fusebit PagerDuty Integration
//
// This simple PagerDuty integration allows you to call PagerDuty APIs on behalf of the tenants of your
// application. Fusebit manages the PagerDuty authorization process and maps tenants of your application
// to their PagerDuty credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from witin your application.
const router = integration.router;

const connectorName = 'pagerdutyConnector';

// The sample test endpoint of this integration gets all incidents stored in the PagerDuty account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a PagerDuty client pre-configured with credentials necessary to communicate with your tenant's PagerDuty account.
  // For the PagerDuty SDK documentation, see https://developer.pagerduty.com/api-reference/ZG9jOjUxNzk5-changelog.
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const incidents = await pagerdutyClient.get('/incidents');

  ctx.body = {
    message: `Identified ${incidents.data.incidents.length} incidents in PagerDuty.`,
  };
});

// Retrieve Incedent Title and URL from PagerDuty
// Note: This endpoint is also used by the sample app
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const incidents = await pagerdutyClient.get('/incidents');

  const incidentList = incidents.resource.map((incident) => ({
    incedentTitle: incident.title,
    incedentLink: incident.html_url,
  }));

  ctx.body = incidentList;
});

module.exports = integration;
