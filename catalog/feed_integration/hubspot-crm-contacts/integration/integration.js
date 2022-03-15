const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'hubspotConnector';

// Test Endpoint: Get all contacts stored in the HubSpot account associated with the tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference https://github.com/HubSpot/hubspot-api-nodejs
  const contacts = await hubspotClient.crm.contacts.getAll();

  ctx.body = `Success! There are ${contacts.length} Contacts in HubSpot`;
});

// Sample App Endpoint: Add a new contact to HubSpot
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const newContact = { properties: { email: `${ctx.req.body.email}`, firstname: `${ctx.req.body.firstName}` } };

  const addContact = await hubspotClient.crm.contacts.basicApi.create(newContact);
});

// Sample App Endpoint: Retrieve contact email address and first names
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const contacts = await hubspotClient.crm.contacts.getAll();

  const contactsList = contacts.map((contact) => ({
    email: contact.properties.email,
    firstName: contact.properties.firstname,
  }));

  ctx.body = contactsList;
});

module.exports = integration;
