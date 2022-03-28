const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'salesforceConnector';

// Test Endpoint: Get all contacts stored in the Salesforce account associated with your tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://jsforce.github.io/.
  const contacts = await salesforceClient.query('SELECT count() FROM Contact');

  ctx.body = {
    message: `Success! Loaded ${contacts.totalSize} contacts from SFDC`,
  };
});

// Endpoint for Sample App: Retrieve Name and Email from Salesforce
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const contacts = await salesforceClient.query('SELECT name, email FROM Contact');

  const contactsList = contacts.records.map((contact) => ({
    contactName: contact.Name,
    contactEmail: contact.Email,
  }));

  ctx.body = contactsList;
});

module.exports = integration;
