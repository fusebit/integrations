const superagent = require('superagent');

const { objectMap } = require('@fusebit/objectmap-utils');
const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

const { chooseSalesforceObject } = require('./chooseSalesforceObject');
const { salesforceObjectMapping } = require('./salesforceObjectMapping');

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'salesforceConnector';

// Test Endpoint: Retrieve Mapping Data Configured by your Tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Retrieve 20 Records of Object Data selected by Tenant
  const configuration = (await integration.tenant.getTenantInstalls(ctx, ctx.params.tenantId))[0];
  const { salesforceObject: objectName } = configuration.data.salesforceObjectSelection;

  // API Reference: https://jsforce.github.io/.
  const queryObjectData = await salesforceClient.sobject(objectName).find().limit(20);



  // Handle No Records Found
  if (!queryObjectData.length) {
    queryObjectData[0] = {};
    for (const m in describeSobjects.fields) {
      queryObjectData[0][describeSobjects.fields[m].name] = null;
    }

  // Remove Redundant Data
  delete queryObjectData[0]?.attributes;

  // Apply Mapping & Return Data
  const transformedData = objectMap.transformData(configuration.data.salesforceObjectMapping, queryObjectData[0]);

  ctx.body = {
    Message: `Success! FieldOne has the following value ${transformedData.FieldOne} and FieldTwo has the following value ${transformedData.FieldTwo}`,
  };
});

// Install Flow - Choose a Salesforce Object to Map
router.get('/api/configure/chooseSalesforceObject', chooseSalesforceObject);

// Install Flow - Do the Mapping
router.get('/api/configure/mapSalesforceObject', salesforceObjectMapping);

// Installation Flow - Form Submission
router.post('/api/configure/form/submitted', async (ctx) => {
  const pl = JSON.parse(ctx.req.body.payload);

  await superagent
    .put(`${ctx.state.params.baseUrl}/session/${pl.state.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
    .send({ output: pl.payload });
  return ctx.redirect(`${ctx.state.params.baseUrl}/session/${pl.state.session}/callback`);
});

// Endpoint for Sample App: Retrieve Fields from Salesforce & Map
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const salesforceClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Retrieve Tenant Mapping
  const configuration = await integration.tenant.getTenantInstalls(ctx, ctx.params.tenantId);
  const { salesforceObject: objectName } = configuration[0].data.salesforceObjectSelection;
  const tenantMapping = configuration[0].data.salesforceObjectMapping;

  // Retrieve 20 Records of Selected Object
  const queryObjectData = await salesforceClient.sobject(objectName).find().limit(20);
  const transformedData = [];

  // Handle No Records Found
  if (queryObjectData.length) {
    for (const m in queryObjectData) {
      // Clean up Metadata and Apply Mapping
      delete queryObjectData[m].attributes;
      transformedData[m] = objectMap.transformData(tenantMapping, queryObjectData[m]);
    }
  }

  ctx.body = transformedData;
});


module.exports = integration;
