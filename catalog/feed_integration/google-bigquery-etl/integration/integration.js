const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

const superagent = require('superagent');
const { v4: uuidv4 } = require('uuid');

const bigquery = require('./bigquery');
const mparticle = require('./mparticle');
const mapping = require('./mapping');

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

const { generateForm: generateProjectForm } = require('./projectForm');
const { generateForm: generateDatasetForm } = require('./datasetForm');
const { generateForm: generateTableForm } = require('./tableForm');
const { generateForm: generateMappingForm } = require('./mappingForm');

const addGoogleConnector = async (ctx, next) => {
  if (ctx.query.session) {
    ctx.state.googleClient = await integration.service.getSdk(ctx, connectorName, ctx.query.session);
  }
  return next();
};

router.use('/api/configure/:formType', addGoogleConnector);

router.get('/api/configure/projectForm', generateProjectForm);
router.get('/api/configure/datasetForm', generateDatasetForm);
router.get('/api/configure/tableForm', generateTableForm);
router.get('/api/configure/mappingForm', generateMappingForm);

router.post('/api/configure/:formType/submitted', async (ctx) => {
  const pl = JSON.parse(ctx.req.body.payload);

  await superagent
    .put(`${ctx.state.params.baseUrl}/session/${pl.state.session}`)
    .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
    .send({ output: pl.payload });

  return ctx.redirect(`${ctx.state.params.baseUrl}/session/${pl.state.session}/callback`);
});

/* Start the ETL process. */
router.post('/api/tenant/:tenantId/test', async (ctx) => {
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Get the configured values
  const install = (await integration.tenant.getTenantInstalls(ctx, ctx.params.tenantId))[0].data;

  const { projectId } = install.projectForm;
  const { datasetId } = install.datasetForm;
  const { tableId } = install.tableForm;
  const { transformations: mappingSpec } = install.mappingForm;

  console.log(`Starting: ${projectId}/${datasetId}/${tableId}`);
  console.log(`${mappingSpec.length} mappings`);

  // Create the read session in BigQuery
  const { session, schema } = await bigquery.createReadSession(googleClient, projectId, datasetId, tableId);

  console.log(`${session.streams.length} streams`);

  try {
    // Create the tasks
    const taskIds = await Promise.all(
      session.streams.map(
        async (stream) =>
          await integration.service.scheduleTask(ctx, {
            path: `/api/transform/tenant/${ctx.params.tenantId}`,
            body: {
              params: {
                projectId,
                datasetId,
                tableId,
              },
              stream: stream.name,
              schema: schema,
              mappingSpec,
            },
          })
      )
    );
  } catch (err) {
    console.log(`task creation error:`, err);
  }

  // Create a id to track the job
  const jobId = uuidv4();

  // TBD Store the generated taskId's in storage to track later.
  // await integration.storage.put(`/imports/${jobId}`, { data: { pending: taskIds, complete: [] } });

  ctx.body = { targetUrl: `${ctx.state.params.baseUrl}/api/tenant/${ctx.params.tenantId}/status/${jobId}` };
});

/* Process each individual stream, which may be many rows, and dispatch to mparticle */
integration.task.on('/api/transform/tenant/:tenantId', async (ctx) => {
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { stream, schema, mappingSpec, params } = ctx.req.body;

  console.log(mappingSpec);
  // Create the mapping object as a set of functions to execute each row over.
  const mappings = mapping.createMappings(mappingSpec);

  try {
    await new Promise(async (resolve, reject) => {
      // Load the data from this stream, apply the mapping, and dispatch the resulting record
      await bigquery.readFromStream(
        googleClient,
        params.projectId,
        stream,
        schema,
        async (row) => {
          const result = await mapping.handleMapping(mappings, row);
          await mparticle.dispatchResult('development', { customerId: ctx.params.tenantId }, result);
        },
        (error) => {
          console.log(`error: `, error);
          reject(error);
        },
        () => {
          console.log(`end`);
          resolve();
        }
      );
    });

    ctx.body = { statusCode: 200 };
  } catch (err) {
    ctx.body = { statusCode: 500, error: err.toString() };
  }

  console.log(`Finished`);

  ctx.status = 200;
});

// TBD Get the status of each of the tasks by iterating over the /imports/:jobId in batches until they're
// all complete.
router.get('/api/tenant/:tenantId/status/:jobId', async (ctx) => {});

module.exports = integration;
