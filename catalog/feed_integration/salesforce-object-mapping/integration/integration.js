const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

const { chooseSalesforceObject } = require('./chooseSalesforceObject.js');
const { salesforceObjectMapping } = require('./salesforceObjectMapping.js');

const { objectMap } = require('session-data-mapper');
const superagent = require('superagent');

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'salesforceConnector';

// Test Endpoint: Retrieve Mapping Data Configured by your Tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Retrieve 20 Records of Object Data selected by Tenant
  const configuration = await integration.tenant.getTenantInstalls(ctx, ctx.params.tenantId);
  const { salesforceObject: objectName } = configuration[0].data.salesforceObjectSelection;

  // API Reference: https://jsforce.github.io/.
  const queryObjectData = await salesforceClient.sobject(objectName).find().limit(20);
  delete queryObjectData[0].attributes;

  // Apply Mapping & Return Data
  const transformedData = objectMap.transformData(configuration[0].data.salesforceObjectMapping, queryObjectData[0]);

  ctx.body = { transformedData };
});

// Install Flow - Choose a Salesforce Object to Map
router.get('/api/configure/chooseSalesforceObject', chooseSalesforceObject);

// Install Flow - Do the Mapping
router.get('/api/configure/mapSalesforceObject', salesforceObjectMapping);

// Installation Flow - Form Submission
router.post('/api/configure/form/submitted', async (ctx) => {
  const pl = JSON.parse(ctx.req.body.payload);
  console.log(ctx.req.body.payload);
  console.log('form submitted!');

  await superagent
    .put(`${ctx.state.params.baseUrl}/session/${pl.state.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
    .send({ output: pl.payload });
  return ctx.redirect(`${ctx.state.params.baseUrl}/session/${pl.state.session}/callback`);
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
