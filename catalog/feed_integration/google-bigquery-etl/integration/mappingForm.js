const fs = require('fs');

const { Internal } = require('@fusebit-int/framework');

const bigquery = require('./bigquery');
const session = require('./session');

const formTemplate = fs.readFileSync(__dirname + '/mapping/form.html', { encoding: 'utf8' });
const uischema = require('./mapping/uischema.json');
const schema = require('./mapping/schema.json');

const generateForm = async (ctx) => {
  // Get this session
  const priorSession = await session.getPriorSession(ctx, ctx.query.session, 'tableForm');

  const { projectId, datasetId, tableId } = priorSession.output;
  console.log(priorSession);

  const bigqueryClient = bigquery.getClient(ctx.state.googleClient);

  // Get the table schema
  const tableSchema = await bigquery.getTableSchema(bigqueryClient, projectId, datasetId, tableId);

  // Get the sample records
  const sampleRecords = await bigquery.getSamples(bigqueryClient, projectId, datasetId, tableId);

  // Adjust the list of available columns
  schema.properties.transformations.items.properties.column.enum = tableSchema.fields.map((field) => field.name);

  const [form, contentType] = Internal.Form({
    schema,
    uiSchema: uischema,
    dialogTitle: 'Configure BigQuery ETL',
    submitUrl: 'form/submitted',
    state: {
      session: ctx.query.session,
    },
    data: {
      transformations: [
        {
          mappingCode: 'async (input) => (input)',
        },
      ],
    },
    cancelUrl: '',
    windowTitle: 'BigQuery ETL',
    template: formTemplate,
  });

  ctx.body = form.replace('##sampleRecords##', JSON.stringify(sampleRecords));
  ctx.header['Content-Type'] = contentType;
};

module.exports = { generateForm };
