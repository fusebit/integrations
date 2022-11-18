const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'calendlyoauthConnector';

// Test Endpoint: Get basic information about your Calendly user account
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const calendlyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developer.calendly.com/api-docs
  const {
    resource: { name, scheduling_url },
  } = await calendlyClient.get('/users/me');

  ctx.body = `Got Calendly user details for ${name}, schedule a meeting at ${scheduling_url}`;
});

// Endpoint for Sample App: Retrieve a list of Scheduled events from Calendly
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const calendlyClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Get current user scheduled events
  const {
    resource: { uri },
  } = await calendlyClient.get('/users/me');

  const { collection } = await calendlyClient.get(`/scheduled_events?user=${uri}`);

  ctx.body = collection.map((event) => ({
    name: event.name,
    location: event.location.type,
  }));
});

module.exports = integration;
