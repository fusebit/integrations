// Asana API Docs: https://developers.asana.com/docs
// Fusebit API Docs: https://developer.fusebit.io/reference/fusebit-int-framework-integration

const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = 'asanaConnector';

// Endpoint for Testing Purposes
// Return number of tasks assigned to user
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration#getsdkbytenant-1
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const assignee = me.gid;

  // API Reference: https://developers.asana.com/docs/get-multiple-tasks
  const tasks = await asanaClient.tasks.getTasks({ workspace, assignee });
  ctx.body = {
    message: `Found ${tasks.data.length} tasks in the Asana Workspace ${me.workspaces[0].name}`,
  };
});

// Endpoint for Sample App
// Retrieve tasks from your Asana Workspace
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

// Endpoint for Sample App
// Add new task to your Asana workspace
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await asanaClient.users.me();
  const workspace = me.workspaces[0].gid;
  const assignee = me.gid;

  // API Reference: https://developers.asana.com/docs/create-a-task
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
