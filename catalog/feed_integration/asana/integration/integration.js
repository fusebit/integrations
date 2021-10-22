// Fusebit Asana Integration
//
// This simple Asana integration allows you to call Asana APIs on behalf of the tenants of your
// application. Fusebit manages the Asana authorization process and maps tenants of your application
// to their Asana credentials, so that you can focus on implementing the integration logic.
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

router.post('/api/tenant/:tenantId/webhook/:resourceId', async (ctx) => {
  try {
    const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
    const data = {};
    const response = await asanaClient.webhooks.fusebitCreate(ctx.params.resourceId, data);
    return { response };
  } catch (e) {
    ctx.throw(e);
  }
});

// This endpoint lists Asana users of the workspace associated with your tenant.
router.get('/api/tenant/:tenantId/me', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
  const me = await asanaClient.users.me();
  ctx.body = me;
});

module.exports = integration;
