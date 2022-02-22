// Fusebit Zoom Integration
//
// This simple Zoom integration allows you to call Zoom APIs on behalf of the tenants of your
// application. Fusebit manages the Zoom authorization process and maps tenants of your application
// to their Zoom credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;
const connectorName = 'zoomConnector';

// The sample test endpoint of this integration gets all contacts stored in the Zoom account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Zoom client pre-configured with credentials necessary to communicate with your tenant's Zoom account.
  const zoomClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const me = await zoomClient.get('/users/me');
  const meetings = await zoomClient.get('/users/me/meetings');

  ctx.body = {
    message: `${me.first_name} ${me.last_name} has ${meetings.total_records} meetings scheduled.`,
  };
});

module.exports = integration;
