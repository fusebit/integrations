// Fusebit HubSpot Integration
//
// This simple HubSpot integration allows you to call HubSpot APIs on behalf of the tenants of your
// application. Fusebit manages the HubSpot authorization process and maps tenants of your application
// to their HubSpot credentials, so that you can focus on implementing the integration logic.
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

const connectorName = 'hubspotConnector';

// The sample test endpoint of this integration gets all contacts stored in the HubSpot account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a HubSpot client pre-configured with credentials necessary to communicate with your tenant's HubSpot account.
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const contacts = await hubspotClient.crm.contacts.getAll();

  ctx.body = `Successfully loaded ${contacts.length} Contacts from HubSpot`;
});

// Add a new contact to HubSpot
// Note: This endpoint is also used by the sample app
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const newContact = { properties: { email: `${ctx.req.body.email}`, firstname: `${ctx.req.body.firstname}` } };
  const addContact = await hubspotClient.crm.contacts.basicApi.create(newContact);
  console.log(addContact);
});

// Retrieve contact email address and first names from HubSpot
// Note: This endpoint is also used by the sample app
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const contacts = await hubspotClient.crm.contacts.getAll();
  const contactsList = [];
  for (let i = 0; i < contacts.length; i++) {
    contactsList[i] = {
      email: contacts[i].properties.email,
      firstname: contacts[i].properties.firstname,
    };
  }
  ctx.body = contactsList;
});

module.exports = integration;
