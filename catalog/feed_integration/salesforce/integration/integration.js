// Fusebit Salesforce Integration
//
// This simple Salesforce integration allows you to call Salesforce APIs on behalf of the tenants of your
// application. Fusebit manages the Salesforce authorization process and maps tenants of your application
// to their Salesforce credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from witin your application.
const router = integration.router;

const connectorName = 'salesforceConnector';

// The sample test endpoint of this integration gets all contacts stored in the Salesforce account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Salesforce client pre-configured with credentials necessary to communicate with your tenant's Salesforce account.
  // For the Salesforce SDK documentation, see https://jsforce.github.io/.
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const contacts = await salesforceClient.query('SELECT count() FROM Contact');

  ctx.body = {
    message: `Successfully loaded ${contacts.totalSize} contacts from SFDC`,
  };
});

module.exports = integration;
