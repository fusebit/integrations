const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'calendlyoauthConnector';

// Test Endpoint: Get all contacts stored in the CalendlyOAuth account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const calendlyoauthClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: test
  const contacts = await calendlyoauthClient.query('SELECT count() FROM Contact');

  ctx.body = {
    message: `Successfully loaded ${contacts.totalSize} contacts from SFDC`,
  };
});

// Endpoint for Sample App: Retrieve a list of Scheduled events from CalendlyOAuth
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const calendlyoauthClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const contacts = await calendlyoauthClient.accountingApi.getContacts(calendlyoauthClient.tenants[0].tenantId);

  ctx.body = contacts.map((contact) => ({
    name: contact.name,
    emailAddress: account.emailAddress,
  }));
});


module.exports = integration;
