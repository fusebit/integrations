const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'microsoftgraphConnector';

// Test Endpoint: Get account information of the Azure AD associated to the authorizing tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const microsoftgraphClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/microsoftgraph/msgraph-sdk-javascript
  const { displayName, mail } = await microsoftgraphClient.api('/me').get();
  ctx.body = `Hello ${displayName}, we got your Azure Active directory for your user account: ${mail}`;
});

// Endpoint for Sample App: Retrieve associated Azure AD account.
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const microsoftgraphClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { displayName, mail } = await microsoftgraphClient.api('/me').get();
  ctx.body = [
    {
      displayName,
      mail,
    },
  ];
});

module.exports = integration;
