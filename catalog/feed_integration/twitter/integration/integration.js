// Fusebit Twitter Integration
//
// This simple Twitter integration allows you to call Twitter APIs on behalf of the tenants of your
// application. Fusebit manages the Twitter authorization process and maps tenants of your application
// to their Twitter credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;
const connectorName = 'twitterConnector';

// The sample test endpoint of this integration gets all contacts stored in the Twitter account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Twitter client pre-configured with credentials necessary to communicate with your tenant's Twitter account.
  // For the Twitter SDK documentation, see https://github.com/PLhery/node-twitter-api-v2.

  const twitterClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const likedTweets = await twitterClient.userLikedTweets('12');
  ctx.body = likedTweets.tweets;
});

module.exports = integration;
