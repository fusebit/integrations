const { Internal } = require('@fusebit-int/framework');

const google = require('./google');

const schemaPrototype = {
  type: 'object',
  properties: {
    projectId: {
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
          scope: '#/properties/projectId',
        },
      ],
    },
  ],
};
const generateForm = async (ctx) => {
  const projects = await google.getProjects(ctx.state.googleClient);

  const schema = { ...schemaPrototype };
  schema.properties.projectId.oneOf = projects.map((project) => ({
    const: project.projectId,
    title: `${project.name} (${project.projectId})`,
  }));

  const [form, contentType] = Internal.Form({
    schema,
    uiSchema,
    state: {
      session: ctx.query.session,
    },
    dialogTitle: 'Configure BigQuery ETL',
    submitUrl: 'form/submitted',
    windowTitle: 'BigQuery ETL',
  });

  ctx.body = form;
  ctx.header['Content-Type'] = contentType;
};

module.exports = { generateForm };
