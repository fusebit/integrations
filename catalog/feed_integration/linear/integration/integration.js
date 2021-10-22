// Fusebit Linear Integration
//
// This simple Linear integration allows you to call Linear APIs on behalf of the tenants of your
// application. Fusebit manages the Linear authorization process and maps tenants of your application
// to their Linear credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration gets all contacts stored in the Linear account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Linear client pre-configured with credentials necessary to communicate with your tenant's Linear account.
  // For the Linear SDK documentation, see https://jsforce.github.io/.
  const linearClient = await integration.tenant.getSdkByTenant(ctx, 'linearConnector', ctx.params.tenantId);

  ctx.body = {
    messasge: 'Successfully loaded contacts from SFDC',
  };
});

// This endpoint lists all Linear issues given a team.
router.get(
  '/api/tenant/:tenantId/team/:team/issues',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {}
);

module.exports = integration;
