const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'linkedinConnector';

// // Test Endpoint: Get lite profile user information from a LinkedIn account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const linkedInClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://docs.microsoft.com/en-us/linkedin/consumer/
  const { id, localizedLastName, localizedFirstName } = await linkedInClient.get('me');
  ctx.body = {
    message: `Success! The user with id ${id} is ${localizedFirstName} ${localizedLastName} on LinkedIn`,
  };
});

module.exports = integration;
