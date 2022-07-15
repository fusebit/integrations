const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'bamboohrConnector';

// Test Endpoint: Get all contacts stored in the BambooHR account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const bamboohrClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://documentation.bamboohr.com/
  const contacts = await bamboohrClient.query('SELECT count() FROM Contact');

  ctx.body = {
    message: `Successfully loaded ${contacts.totalSize} contacts from SFDC`,
  };
});



module.exports = integration;
