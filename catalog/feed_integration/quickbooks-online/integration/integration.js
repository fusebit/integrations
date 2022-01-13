// Fusebit QuickBooks Online Integration
//
// This simple QuickBooks Online integration allows you to call QuickBooks Online APIs on behalf of the tenants of your
// application. Fusebit manages the QuickBooks Online authorization process and maps tenants of your application
// to their QuickBooks Online credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Remove this line when using production credentials for QuickBooks
process.env.QUICKBOOKS_USE_SANDBOX = '1';

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;
const connectorName = 'quickbooksConnector';

// The sample test endpoint of this integration gets all Accounts.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a QuickBooks Online client pre-configured with credentials necessary to communicate with your tenant's QuickBooks Online account.
  // For the QuickBooks Online SDK documentation, see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account
  // and https://www.npmjs.com/package/node-quickbooks.
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  const accounts = await sdk.findAccounts();

  ctx.body = { message: `Account total: ${accounts.QueryResponse.Account.length}` };
});

// Used by the sample application to get customers in the account.
router.get('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  const customers = await sdk.findCustomers({ fetchAll: true });

  ctx.body = customers;
});

// Used by the sample application to add customers to the account.
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  const customer = await sdk.createCustomer(ctx.req.body);

  ctx.body = customer;
});

module.exports = integration;
