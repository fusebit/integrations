const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const connectorName = 'salesforceConnector';

const schema = require('./chooseSalesforceObjectSchema.json');
const uiSchema = require('./chooseSalesforceObjectuiSchema.json');

const chooseSalesforceObject = async (ctx) => {
  const salesforceClient = await integration.service.getSdk(ctx, connectorName, ctx.query.session);

  // Get list of all Salesforce Objects
  const listSobject = await salesforceClient.describeGlobal();

  // Extract Names into Array
  const objectEnums = [];
  for (const k in listSobject.sobjects) {
    objectEnums[k] = listSobject.sobjects[k].name;
  }

  // Sort and Populate Schema with Options
  objectEnums.sort();
  schema.properties.salesforceObject.enum = objectEnums;

  // create JsonForm with updated Schema
  const [form, contentType] = integration.response.createJsonForm({
    schema,
    uiSchema,
    windowTitle: 'Salesforce Object Selection',
    dialogTitle: 'Choose a Salesforce Object to Map',
    submitUrl: 'form/submitted',
    state: {
      session: ctx.query.session,
    },
  });

  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
};

module.exports = { chooseSalesforceObject };
