const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'microsoftdynamicsConnector';

// Test Endpoint: Get all contacts stored in the MicrosoftDynamics account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const request = {
    collection: 'incidents',
    select: ['title', 'ticketnumber'],
    maxPageSize: 1,
    count: true,
  };

  const { oDataCount } = await client.retrieveMultipleRequest(request);
  ctx.body = `You have ${oDataCount} Cases in your Microsoft Dynamics Customer Service instance`;
});

// Endpoint for Sample App: Retrieve Cases
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { value } = await client.retrieveMultiple('incidents', ['title', 'ticketnumber']);
  const casesMap = value.map(({ title, ticketnumber }) => ({
    caseTitle: title,
    caseNumber: ticketnumber,
  }));

  ctx.body = casesMap;
});

// Endpoint for Sample App: Add new Case to your Microsoft Dynamics Customer Service instance
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const newCase = {
    title: 'Test Case from Fusebit!',
    description: 'This Case was created from Node.js using Fusebit!',
  };
  // Fetch a random Contact to associate to the Case
  const request = {
    collection: 'contacts',
    select: ['fullname', 'lastname'],
    maxPageSize: 1,
    count: true,
  };

  const { value } = await client.retrieveMultipleRequest(request);
  newCase['customerid_contact@odata.bind'] = `/contacts(${value[0].contactid})`;
  const response = await client.create(newCase, 'incidents');
  ctx.body = 'Case created!';
});

module.exports = integration;
