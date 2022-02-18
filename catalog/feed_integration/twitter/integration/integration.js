// Fusebit twitter Integration
//
// This simple twitter integration allows you to call twitter APIs on behalf of the tenants of your
// application. Fusebit manages the twitter authorization process and maps tenants of your application
// to their twitter credentials, so that you can focus on implementing the integration logic.
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

// This sample test endpoint provides the twitter karma held by the tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const twitterClient = await integration.tenant.getSdkByTenant(ctx, 'twitter-connector', ctx.params.tenantId);
  const v2TwitterClient = twitterClient.v2;
  const me = await v2TwitterClient.me();
  const tweets = await v2TwitterClient.userTimeline(me.data.id);
  ctx.body = tweets.data.data;
});

module.exports = integration;
