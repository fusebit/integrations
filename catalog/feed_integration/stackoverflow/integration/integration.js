// Fusebit Stack Overflow Integration
//
// This simple Stack Overflow integration allows you to call Stack Overflow APIs on behalf of the tenants of your
// application. Fusebit manages the Stack Overflow authorization process and maps tenants of your application
// to their Stack Overflow credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'stackoverflowConnector';

// The sample test endpoint of this integration gets all contacts stored in the Stack Overflow account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Stack Overflow client pre-configured with credentials necessary to communicate with your tenant's Stack Overflow account.
  // For the Stack Overflow SDK documentation, see https://api.stackexchange.com/docs.
  const stackoverflowClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const user = (await stackoverflowClient.site('stackoverflow').get('/me')).items[0];

  ctx.body = {
    message: `You have ${user.reputation} reputation points with Stack Overflow`,
  };
});

module.exports = integration;
