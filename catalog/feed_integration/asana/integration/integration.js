// Fusebit Asana Integration
//
// This simple Asana integration allows you to call Asana APIs on behalf of the tenants of your
// application. Fusebit manages the Asana authorization process and maps tenants of your application
// to their Asana credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from witin your application.
const router = integration.router;

const connectorName = 'asanaConnector';

// This sample test endpoint provides the number of tasks within the tenant's first workspace
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const assignee = me.gid;
  const tasks = await asanaClient.tasks.getTasks({ workspace, assignee });
  ctx.body = {
    message: `Found ${tasks.data.length} tasks in the Asana Workspace ${me.workspaces[0].name}`,
  };
});

// Retrieve tasks from your Asana Workspace
// Note: This endpoint is also used by the sample app
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const assignee = me.gid;

  const tasks = await asanaClient.tasks.getTasks({ workspace, assignee });

  const taskGIDs = tasks.data.map((tasks) => ({
    taskGID: tasks.gid,
  }));

  const taskDetails = [];
  for (const gid of taskGIDs) {
    const task = await asanaClient.tasks.getTask(gid.taskGID);
    taskDetails.push({
      taskName: task.name,
      taskNotes: task.notes,
    });
  }

  ctx.body = taskDetails;
});

// Add new task to your Asana workspace
// Note: This endpoint is also used by the sample app
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const assignee = me.gid;

  const tasks = await asanaClient.tasks.createTask({
    name: ctx.req.body.taskName,
    notes: ctx.req.body.taskNotes,
    workspace: workspace,
    assignee: assignee,
  });

  ctx.body = tasks;
});

// The sample test endpoint registers a new webhook for use with this integration
router.post(
  '/api/tenant/:tenantId/webhook/-/resource/:resourceId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
      const webhook = await asanaWebhookClient.create(ctx.params.resourceId, {});
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

// The sample test endpoint fetches a webhook by Id
router.get(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
      const webhook = await asanaWebhookClient.get(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

// The sample test endpoint deletes a webhook by Id
router.delete(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
      const webhook = await asanaWebhookClient.delete(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

integration.event.on('/asanaConnector/webhook/:eventType', (ctx) => {
  console.log('webhook received: ', ctx.req.body.data);
});

module.exports = integration;
