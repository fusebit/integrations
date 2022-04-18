const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Search for videos on YouTube
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: hhttps://developers.google.com/youtube/v3/docs/
  const youtube = googleClient.youtube('v3');
  const res = await youtube.search.list({
    part: 'id,snippet',
    q: 'Fusebit',
  });

  ctx.body = {
    message: `Success! Found ${res.data.items.length} matching videos.`,
  };
});

module.exports = integration;
