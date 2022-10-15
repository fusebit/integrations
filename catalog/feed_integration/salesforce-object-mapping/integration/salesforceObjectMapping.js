const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const connectorName = 'salesforceConnector';

const { objectMap } = require('session-data-mapper');
const superagent = require('superagent');

const uiSchema = require('./salesforceObjectMappinguiSchema.json');
const targetSchema = require('./salesforceObjectMappingTargetSchema.json');

const salesforceObjectMapping = async (ctx) => {
  // Get this session
  const session = await superagent
    .get(`${ctx.state.params.baseUrl}/session/${ctx.query.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);

  // Get details from the previous session's configuration
  const details = await superagent
    .get(`${ctx.state.params.baseUrl}/session/${session.body.dependsOn['salesforceObjectSelection'].entityId}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`);

  const { salesforceObject: objectName } = details.body.output;

  // Get the list of Fields for the Selected Object
  const salesforceClient = await integration.service.getSdk(ctx, connectorName, ctx.query.session);
  const describeSobjects = await salesforceClient.describe(objectName);

  // Create "Source" Schema from Salesforce Object (See Target Schema for Formatting)
  const salesforceObjectSchema = {
    type: `object`,
    title: `Salesforce ${objectName} Fields`,
    properties: {},
  };

  for (const m in describeSobjects.fields) {
    salesforceObjectSchema.properties[describeSobjects.fields[m].name] = {
      type: describeSobjects.fields[m].type,
    };
  }

  // Query Single Record for the Selected Object
  const salesforceObjectRecord = await salesforceClient.sobject(objectName).find().limit(1);
  delete salesforceObjectRecord[0].attributes;

  // Helper Function to Generate Schema & Source Data for ObjectMap Jsonforms Component
  const { data: data, schema: schema } = objectMap.createSchema({
    source: salesforceObjectSchema,
    target: targetSchema,
    uischema: uiSchema,
    dataToTransform: salesforceObjectRecord[0],
  });

  const [form, contentType] = integration.response.createJsonForm({
    schema: schema,
    uiSchema: uiSchema,
    data: data,
    windowTitle: 'Salesforce Object Mapping',
    dialogTitle: 'Choose the Corresponding Fields for Salesforce',
    submitUrl: 'form/submitted',
    state: {
      session: ctx.query.session,
    },
  });

  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
};

module.exports = { salesforceObjectMapping };
