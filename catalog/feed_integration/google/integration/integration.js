const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Get the openid and email of the currently authenticated user
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/googleapis/google-api-nodejs-client
  const me = await googleClient.people('v1').people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,addresses,externalIds,interests',
  });

  ctx.body = {
    message: `Success! Your email address has ${me.data.emailAddresses[0].value.length} characters`,
  };
});

module.exports = integration;
