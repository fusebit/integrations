const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();
const router = integration.router;

router.get('/api/do/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  ctx.body = await sdk.getAccessibleResources();
});

integration.event.on('/:connectorId/webhook/:installId', async (ctx) => {
  console.log(`Event from Jira: ${JSON.stringify(ctx.params)}`);
  console.log(`${JSON.stringify(ctx.req.body, null, 2)}`);
});

integration.event.on('create/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  const resources = await sdk.getAccessibleResources();
  const registerResponse = await sdk.webhook.register(resources[0].id, [
    {
      jqlFilter: 'status != done',
      events: ['jira:issue_created', 'jira:issue_updated'],
    },
  ]);

  ctx.body = registerResponse.body;
});

integration.event.on('remove/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  await sdk.webhook.deleteAll();
});

// --------------------------------------------------------------------

router.get('/api/deleteAll/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }

  ctx.body = await webhook.deleteAll();
});

router.get('/api/list/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }
  const resources = await sdk.getAccessibleResources();
  ctx.body = await sdk.webhook.list(resources[0].id);
});

router.get('/api/register/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
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

const { AtlassianWebhook } = require('@fusebit-int/atlassian-provider');
AtlassianWebhook.enable(integration);
module.exports = integration;
