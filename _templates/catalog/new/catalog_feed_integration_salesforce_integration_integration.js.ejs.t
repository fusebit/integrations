---
to: catalog/feed_integration/<%= name.toLowerCase() %>/integration/integration.js
---
const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = '<%= connectorName.toLowerCase() %>Connector';

// Test Endpoint: Get all contacts stored in the <%= h.capitalize(name) %> account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const <%= name.toLowerCase() %>Client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: <%= connectorSDKLink %>
  const contacts = await <%= name.toLowerCase() %>Client.query('SELECT count() FROM Contact');

  ctx.body = {
    message: `Successfully loaded ${contacts.totalSize} contacts from SFDC`,
  };
});

module.exports = integration;
