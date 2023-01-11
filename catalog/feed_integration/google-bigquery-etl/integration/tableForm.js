const { Internal } = require('@fusebit-int/framework');

const bigquery = require('./bigquery');

const session = require('./session');

const schemaPrototype = {
  type: 'object',
  properties: {
    projectId: {
      type: 'string',
    },
    datasetId: {
      type: 'string',
    },
    tableId: {
      type: 'string',
      oneOf: [],
    },
  },
};

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/tableId',
        },
      ],
    },
  ],
};

const generateForm = async (ctx) => {
  // Get this session
  const priorSession = await session.getPriorSession(ctx, ctx.query.session, 'datasetForm');

  // Use the projectId and datasetId to get the list of available tables.
  const { projectId, datasetId } = priorSession.output;

  const tables = await bigquery.getTables(ctx.state.googleClient, projectId, datasetId);

  const schema = { ...schemaPrototype };
  schema.properties.tableId.oneOf = tables.map((table) => ({
    title: table.tableReference.tableId,
    const: table.tableReference.tableId,
  }));

  const [form, contentType] = Internal.Form({
    schema,
    uiSchema,
    state: {
      session: ctx.query.session,
    },
    data: {
      projectId,
      datasetId,
    },
    dialogTitle: 'Configure BigQUery ETL',
    submitUrl: 'form/submitted',
    windowTitle: 'BigQuery ETL',
  });

  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
};

module.exports = { generateForm };
