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

// This sample test endpoint gets the Asana user information for the individual that authenticated the asana integration
router.get('/api/tenant/:tenantId/me', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
  const me = await asanaClient.users.me();
  ctx.body = me;
});

// The sample test endpoint registers a new webhook for use with this integration
router.post('/api/tenant/:tenantId/webhook/:resourceId', async (ctx) => {
  try {
    const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
    const data = {};
    const webhook = await asanaClient.webhooks.fusebitCreate(ctx.params.resourceId, data);
    ctx.body = webhook;
  } catch (e) {
    ctx.throw(e);
  }
});

router.get('/api/tenant/:tenantId/webhook', async (ctx) => {
  try {
    const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
    const me = await asanaClient.users.me();
    const workspaces = me.workspaces;
    const workspaceIds = workspaces.map((workspace) => workspace.gid);
    const webhooks = await Promise.all(
      workspaceIds.flatMap(async (workspaceId) => {
        return (await asanaClient.webhooks.getAll(workspaceId)).data;
      })
    );
    ctx.body = webhooks;
  } catch (e) {
    ctx.throw(e);
  }
});

router.delete('/api/tenant/:tenantId/webhook/:subdomain', async (ctx) => {
  try {
    const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
    const me = await asanaClient.users.me();
    const workspaces = me.workspaces;
    const workspaceIds = workspaces.map((workspace) => workspace.gid);
    await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const webhooks = (await asanaClient.webhooks.getAll(workspaceId)) || [];
        return Promise.all(
          webhooks.data
            .filter((webhook) => {
              return webhook.target.includes(ctx.params.subdomain);
            })
            .map((webhook) => {
              return asanaClient.webhooks.deleteById(webhook.gid);
            })
        );
      })
    );
  } catch (e) {
    ctx.throw(e);
  }
});

integration.event.on('/asanaConnector/webhook/:eventType', (ctx) => {
  console.log('webhook received: ', ctx.req.body);
});

module.exports = integration;
