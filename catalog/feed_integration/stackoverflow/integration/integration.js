const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'stackoverflowConnector';

// Test Endpoint: Get the reputation points of the Stack Overflow account associated with your tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const stackoverflowClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  //API Reference: https://api.stackexchange.com/docs
  const user = (await stackoverflowClient.site('stackoverflow').get('/me')).items[0];

  ctx.body = {
    message: `Success! You have ${user.reputation} reputation points with Stack Overflow`,
  };
});

module.exports = integration;
