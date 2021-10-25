// Fusebit Reddit Integration
//
// This simple Reddit integration allows you to call Reddit APIs on behalf of the tenants of your
// application. Fusebit manages the Reddit authorization process and maps tenants of your application
// to their Reddit credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration sends a Direct Message to the Reddit user associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Reddit client pre-configured with credentials necessary to communicate with your tenant's Reddit profile.
  const redditClient = await integration.tenant.getSdkByTenant(ctx, 'redditConnector', ctx.params.tenantId);

  // Get the Reddit user ID associated with your tenant
  const redditUserId = redditClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Reddit user
  const result = await redditClient.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: redditUserId,
  });

  ctx.body = { message: `Successfully sent a message to Reddit user ${redditUserId}!` };
});

// The postMessage endpoint of this integration is designed to take the body of a post request and forward it as a reddit message
router.post('/api/postMessage/:tenantId', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Reddit client pre-configured with credentials necessary to communicate with your tenant's Reddit workspace.
  // For the Reddit SDK documentation, see https://reddit.dev/node-reddit-sdk/web-api.
  const redditClient = await integration.tenant.getSdkByTenant(ctx, 'redditConnector', ctx.params.tenantId);

  // Get the Reddit user ID associated with your tenant
  const redditUserId = redditClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Reddit user
  const result = await redditClient.chat.postMessage({
    text: ctx.req.body.message,
    channel: redditUserId,
  });

  ctx.body = { message: `Successfully sent a message to Reddit user ${redditUserId}!` };
});

module.exports = integration;
