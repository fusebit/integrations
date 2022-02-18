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
// to the integration, which you can then call from witin your application.
const router = integration.router;

const connectorName = 'twitterConnector';

// This sample test endpoint provides the logged in user's most recent tweet
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const twitterClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const me = await twitterClient.v2.me();
  const tweets = await twitterClient.v2.userTimeline(me.data.id);
  ctx.body = `{USER NAME}'s most recent tweet was: "${tweets.data.data[0].text}"`;
});

module.exports = integration;
