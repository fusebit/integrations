const { Integration } = require('@fusebit-int/framework');
const { AtlassianWebhook } = require('@fusebit-int/atlassian-provider');

const integration = new Integration();
const router = integration.router;

router.get('/api/do/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  ctx.body = await sdk.getAccessibleResources();
});

router.get('/api/deleteAll/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }
  ctx.body = await sdk.webhook.deleteAll();
});

router.get('/api/list/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }
  const resources = await sdk.getAccessibleResources();
  ctx.body = await sdk.webhook.list(resources[0].id);
});

router.get('/api/register/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }
  const resources = await sdk.getAccessibleResources();
  const registerResponse = await sdk.webhook.register(resources[0].id, [
    {
      jqlFilter: 'status != done',
      events: ['jira:issue_created', 'jira:issue_updated'],
    },
  ]);

  ctx.body = registerResponse;
});

integration.event.on('/:param1/:param2/:param3', async (ctx) => {
  console.log(`Event from Jira: ${JSON.stringify(ctx.params)}`);
  console.log(`${JSON.stringify(ctx.req.body, null, 2)}`);
});

AtlassianWebhook.enable(integration);

module.exports = integration;
