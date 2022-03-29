const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;

const connectorName = 'twitterConnector';

// Test Endpoint: Get the logged in user's most recent tweet
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const twitterClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  //API Reference: https://github.com/plhery/node-twitter-api-v2
  const me = await twitterClient.v2.me();
  const tweets = await twitterClient.v2.userTimeline(me.data.id);
  ctx.body = `Success! ${me.data.name}'s most recent tweet was: "${tweets.data.data?.[0].text}"`;
});

module.exports = integration;
