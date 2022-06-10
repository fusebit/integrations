const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'constantcontactConnector';

// Test endpoint: Get the list of contacts.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const constantcontactClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developer.constantcontact.com/api_reference/
  const contacts = await constantcontactClient.get('/contacts');

  ctx.body = {
    message: `Successfully loaded ${contacts.contacts.length} contacts from Constant Contact`,
  };
});

// Endpoint for Sample App: Retrieve a list of contacts from ConstantContact
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const constantcontactClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Include API Reference for ConstantContact
  const contacts = await constantcontactClient.get('/contacts');

  ctx.body = contacts.contacts.map((contact) => ({
    firstName: contact.first_name,
    lastName: contact.last_name,
  }));
});

// Endpoint for Sample App: Create a new contact in ConstantContact
router.post('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const constantcontactClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Create a new contact
  await constantcontactClient.post('/contacts', {
    create_source: 'Account',
    first_name: ctx.req.body.firstName,
    last_name: ctx.req.body.lastName,
    email_address: {
      address: `${ctx.req.body.firstName}@${ctx.req.body.lastName}.com`,
      permission_to_send: 'unsubscribed',
    },
  });
});

module.exports = integration;
