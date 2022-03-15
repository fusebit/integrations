const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'githubOAuthConnector';

// Test Endpoint: Get account details in the GitHub account associated with your tenant.
router.post('/api/tenant/:tenantId/test', async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const github = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/octokit/octokit.js
  const { data } = await github.rest.users.getAuthenticated();
  console.log('Success!');

  ctx.body = data;
});

// Receive Webhook Events
integration.event.on('/:componentName/webhook/(issues.*)', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('captured webhook', data);
});

module.exports = integration;
