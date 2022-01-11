// Fusebit YouTube Integration
//
// This simple YouTube integration allows you to call YouTube APIs on behalf of the tenants of your
// application. Fusebit manages the YouTube authorization process and maps tenants of your application
// to their YouTube credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'googleConnector';

// The sample test endpoint of this integration gets all contacts stored in the YouTube account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a YouTube client pre-configured with credentials necessary to communicate with your tenant's YouTube account.
  // For the YouTube SDK documentation, see https://youtube.com/.
  const google = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const youtube = google.youtube('v3');

  const res = await youtube.search.list({
    part: 'id,snippet',
    q: 'Fusebit',
  });

  ctx.body = {
    message: `Found ${res.data.items.length} matching videos.`,
  };
});

module.exports = integration;
