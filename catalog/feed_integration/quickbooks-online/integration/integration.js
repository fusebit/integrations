const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'quickbooksConnector';

// Use Sandbox Creds. Remove this line if using Production Creds.
process.env.QUICKBOOKS_USE_SANDBOX = '1';

// Test Endpoint: Gets all Accounts associated with your tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const quickbooksClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/mcohen01/node-quickbooks
  const accounts = await quickbooksClient.findAccounts();

  ctx.body = { message: `Success! Account total: ${accounts.QueryResponse.Account.length}` };
});

// Endpoint for Sample App: Get customers of an account
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const quickbooksClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const customers = await quickbooksClient.findCustomers({ fetchAll: true });
  const customersList = (customers.QueryResponse?.Customer || []).map((customer) => ({
    GivenName: customer.GivenName,
    FamilyName: customer.FamilyName,
  }));
  ctx.body = customersList;
});

// Endpoint for Sample App: Add Customer to an account
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const quickbooksClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const customer = await quickbooksClient.createCustomer(ctx.req.body);

  ctx.body = customer;
});

module.exports = integration;
