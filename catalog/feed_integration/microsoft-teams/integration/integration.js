// Fusebit Microsoft Teams Integration
//
// This simple Microsoft Teams integration allows you to call Microsoft Teams on behalf of the tenants of your
// application. Fusebit manages the Microsoft Teams authorization process and maps tenants of your application
// to their Microsoft Teams credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration sends a Direct Message to the Microsoft Teams user associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Microsoft Teams client pre-configured with credentials necessary to communicate with your tenant's Microsoft Teams workspace.
  // For the Microsoft Teams SDK documentation, see https://github.com/microsoftgraph/msgraph-sdk-javascript.
  const microsoftTeamsClient = await integration.tenant.getSdkByTenant(
    ctx,
    'microsoftTeamsConnector',
    ctx.params.tenantId
  );

  // Get the Microsoft Teams user ID associated with your tenant
  const microsoftTeamsUserId = microsoftTeamsClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Microsoft Teams user
  const result = await microsoftTeamsClient.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: microsoftTeamsUserId,
  });

  ctx.body = { message: `Successfully sent a message to Microsoft Teams user ${microsoftTeamsUserId}!` };
});

// The postMessage endpoint of this integration is designed to take the body of a post request and forward it as a Microsoft Teams message
router.post('/api/postMessage/:tenantId', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Microsoft Teams client pre-configured with credentials necessary to communicate with your tenant's Microsoft Teams workspace.
  // For the Microsoft Teams SDK documentation, see https://github.com/microsoftgraph/msgraph-sdk-javascript.
  const microsoftTeamsClient = await integration.tenant.getSdkByTenant(
    ctx,
    'microsoftTeamsConnector',
    ctx.params.tenantId
  );

  // Get the Microsoft Teams user ID associated with your tenant
  const microsoftTeamsUserId = microsoftTeamsClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Microsoft Teams user
  const result = await microsoftTeamsClient.chat.postMessage({
    text: ctx.req.body.message,
    channel: microsoftTeamsUserId,
  });

  ctx.body = { message: `Successfully sent a message to Microsoft Teams user ${microsoftTeamsUserId}!` };
});

// This endpoint lists Microsoft Teams users of the workspace associated with your tenant.
router.get('/api/tenant/:tenantId/users', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const microsoftTeamsClient = await integration.tenant.getSdkByTenant(
    ctx,
    'microsoftTeamsConnector',
    ctx.params.tenantId
  );

  const result = await microsoftTeamsClient.users.list();

  ctx.body = result;
});

// This event handler responds to messages in channels that the bot has access to
integration.event.on('/:componentName/webhook/message', async (ctx) => {
  const microsoftTeamsClient = await integration.service.getSdk(
    ctx,
    ctx.params.componentName,
    ctx.req.body.installIds[0]
  );

  const messagingUser = ctx.req.body.data.event.user;
  const authorizedListeningUser = ctx.req.body.data.authorizations[0].user_id;

  if (messagingUser === authorizedListeningUser) {
    console.log('Skipping to avoid recursive response (i.e., infinite loop).');
    return;
  }

  const text = ctx.req.body.data.event.text;
  await microsoftTeamsClient.chat.postMessage({
    text: `I'm responding via a webhook.  I was alerted when <@${messagingUser}> sent the message: \n\n "${text}"`,
    channel: ctx.req.body.data.event.channel,
  });
});

module.exports = integration;
