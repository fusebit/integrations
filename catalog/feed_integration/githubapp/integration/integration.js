const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'githubappConnector';

// Test Endpoint: Gets user account details in the GitHub account associated with your tenant.
router.post('/api/tenant/:tenantId/test', async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const githubapp = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://docs.github.com/en/rest
  const userClient = githubapp.user();
  const {
    data: { login, public_repos, followers },
  } = await userClient.rest.users.getAuthenticated();
  ctx.body = `Success! Your GitHub login is ${login} with ${public_repos} public repositories and ${followers} followers`;
});

// Receive Webhook Events
integration.event.on('/:componentName/webhook/(issues.*)', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('captured webhook', data);
});

module.exports = integration;
