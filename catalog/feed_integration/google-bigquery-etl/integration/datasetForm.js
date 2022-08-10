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
          scope: '#/properties/datasetId',
        },
      ],
    },
  ],
};

const generateForm = async (ctx) => {
  // Get this session
  const priorSession = await session.getPriorSession(ctx, ctx.query.session, 'projectForm');

  console.log(priorSession);
  // Use the projectId to get the list of available datasets.
  const projectId = priorSession.output.projectId;
  const datasets = await bigquery.getDatasets(ctx.state.googleClient, priorSession.output.projectId);

  const schema = { ...schemaPrototype };

  schema.properties.datasetId.oneOf = datasets.map((dataset) => ({
    title: dataset.id,
    const: dataset.datasetReference.datasetId,
  }));

  const [form, contentType] = Internal.Form({
    schema,
    uiSchema,
    state: {
      session: ctx.query.session,
    },
    data: {
      projectId,
    },
    dialogTitle: 'Configure BigQuery ETL',
    submitUrl: 'form/submitted',
    windowTitle: 'BigQuery ETL',
  });

  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
};

module.exports = { generateForm };
