// Fusebit Reddit Integration
//
// This simple Reddit integration allows you to call Reddit APIs on behalf of the tenants of your
// application. Fusebit manages the Reddit authorization process and maps tenants of your application
// to their Reddit credentials, so that you can focus on implementing the integration logic.
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

const connectorName = 'redditConnector';

// This sample test endpoint provides the reddit karma held by the tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const redditClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await redditClient.getMe();
  const { link_karma, comment_karma } = me;
  ctx.body = {
    message: `This tenant has ${link_karma} karma from submitted posts and ${comment_karma} karma from comments.`,
  };
});

module.exports = integration;
