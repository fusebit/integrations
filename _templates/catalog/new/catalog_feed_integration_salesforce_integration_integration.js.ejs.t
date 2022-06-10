---
to: catalog/feed_integration/<%= name.toLowerCase() %>/integration/integration.js
---
// Fusebit <%= h.capitalize(name) %> Integration
//
// This simple <%= h.capitalize(name) %> integration allows you to call <%= h.capitalize(name) %> APIs on behalf of the tenants of your
// application. Fusebit manages the <%= h.capitalize(name) %> authorization process and maps tenants of your application
// to their <%= h.capitalize(name) %> credentials, so that you can focus on implementing the integration logic.
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
const connectorName = '<%= name.toLowerCase() %>Connector';

// The sample test endpoint of this integration gets all contacts stored in the <%= h.capitalize(name) %> account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a <%= h.capitalize(name) %> client pre-configured with credentials necessary to communicate with your tenant's <%= h.capitalize(name) %> account.
  // For the <%= h.capitalize(name) %> SDK documentation, see https://<%= name.toLowerCase() %>.com/.
  const <%= name.toLowerCase() %>Client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

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
