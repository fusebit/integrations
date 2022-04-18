const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'redditConnector';

// Test Endpoint: Get Reddit karma held by the tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const redditClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/not-an-aardvark/snoowrap
  const me = await redditClient.getMe();
  const { link_karma, comment_karma } = me;
  ctx.body = {
    message: `Success! This tenant has ${link_karma} karma from submitted posts and ${comment_karma} karma from comments.`,
  };
});

module.exports = integration;
