// Fusebit Asana Integration
//
// This simple Asana integration allows you to call Asana APIs on behalf of the tenants of your
// application. Fusebit manages the Asana authorization process and maps tenants of your application
// to their Asana credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration sends a Direct Message to the Asana user associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Asana client pre-configured with credentials necessary to communicate with your tenant's Asana workspace.
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana.
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);

  // Get the Asana user ID associated with your tenant
  const asanaUserId = asanaClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Asana user
  const result = await asanaClient.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: asanaUserId,
  });

  ctx.body = { message: `Successfully sent a message to Asana user ${asanaUserId}!` };
});

// This endpoint lists Asana users of the workspace associated with your tenant.
router.get('/api/tenant/:tenantId/me', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const asanaClient = await integration.tenant.getSdkByTenant(ctx, 'asanaConnector', ctx.params.tenantId);
  const me = await asanaClient.users.me();
  ctx.body = me;
});

// This event handler responds to messages in channels that the bot has access to
integration.event.on('/:componentName/webhook/event_callback', async (ctx) => {
  const asanaClient = await integration.service.getSdk(ctx, ctx.params.componentName, ctx.req.body.installIds[0]);

  const messagingUser = ctx.req.body.data.event.user;
  const authorizedListeningUser = ctx.req.body.data.authorizations[0].user_id;

  if (messagingUser === authorizedListeningUser) {
    console.log('Skipping to avoid recursive response (i.e., infinite loop).');
    return;
  }

  const text = ctx.req.body.data.event.text;
  await asanaClient.chat.postMessage({
    text: `I'm responding via a webhook.  I was alerted when <@${messagingUser}> sent the message: \n\n "${text}"`,
    channel: ctx.req.body.data.event.channel,
  });
});

module.exports = integration;
