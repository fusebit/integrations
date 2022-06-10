const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'xeroConnector';

// Test Endpoint: Get the list of Accounts in a Xero Account
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const xeroClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Optional if the tenantId is supplied by the caller; otherwise populates xeroClient.tenants.
  await xeroClient.updateTenants();

  const accounts = await xeroClient.accountingApi.getAccounts(xeroClient.tenants[0].tenantId);

  ctx.body = {
    message: `Successfully loaded ${accounts.body.accounts.length} accounts from Xero`,
  };
});

// Endpoint for Sample App: Retrieve a list of contacts from Xero
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const xeroClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Include API Reference for Xero
  await xeroClient.updateTenants();
  const contacts = await xeroClient.accountingApi.getContacts(xeroClient.tenants[0].tenantId);

  ctx.body = contacts.map((contact) => ({
    name: contact.name,
    emailAddress: account.emailAddress,
  }));
});

// Endpoint for Sample App: Create a new contact
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const xeroClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Include API Reference for Xero
  await xeroClient.updateTenants();

  // Create a new contact
  await xeroClient.accountingApi.updateOrCreateContact(xeroClient.tenants[0].tenantId, {
    contacts: [{ name: ctx.req.body.name, emailAddress: ctx.req.body.emailAddress }],
  });
});

module.exports = integration;
