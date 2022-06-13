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

<% if (locals.isGetEnabled) { -%>
// Endpoint for Sample App: Retrieve a list of <%= h.pluralize(itemName) %> from <%= h.capitalize(name) %>
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const <%= name.toLowerCase() %>Client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const contacts = await <%= name.toLowerCase() %>Client.accountingApi.getContacts(<%= name.toLowerCase() %>Client.tenants[0].tenantId);

  ctx.body = contacts.map((contact) => ({
    name: contact.name,
    emailAddress: account.emailAddress,
  }));
});
<% } -%>

<% if (locals.isPostEnabled) { -%>
// Endpoint for Sample App: Create a new <%= itemName.toLowerCase() %> in <%= h.capitalize(name) %>
router.post('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const <%= name.toLowerCase() %>Client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Create a new contact
  await <%= name.toLowerCase() %>Client.accountingApi.updateOrCreateContact(<%= name.toLowerCase() %>Client.tenants[0].tenantId, {
    contacts: [{ name: ctx.req.body.name, emailAddress: ctx.req.body.emailAddress }],
  });
});
<% } -%>

module.exports = integration;
