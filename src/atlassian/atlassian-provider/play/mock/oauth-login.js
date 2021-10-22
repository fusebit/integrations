const { Integration } = require('@fusebit-int/framework');
const { AtlassianWebhook } = require('@fusebit-int/atlassian-provider');

const integration = new Integration();
const router = integration.router;

router.get('/api/do/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  ctx.body = await sdk.getAccessibleResources();
});

router.get('/api/register/:installationId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installationId);
  if (!sdk) {
    ctx.body = { message: 'No sdk found' };
    return;
  }
  const resources = await sdk.getAccessibleResources();
  const registerResponse = await sdk.webhook.register(resources[0].url, [
    {
      jqlFilter: 'status != done',
      events: ['jira:issue_created', 'jira:issue_updated'],
    },
  ]);

  ctx.body = registerResponse;
});

AtlassianWebhook.enable(integration);

module.exports = integration;
