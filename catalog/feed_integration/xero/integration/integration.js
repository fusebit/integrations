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

module.exports = integration;
