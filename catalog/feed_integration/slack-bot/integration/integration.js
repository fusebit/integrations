// Fusebit Slack Integration
//
// This simple Slack integration allows you to call Slack APIs on behalf of the tenants of your
// application. Fusebit manages the Slack authorization process and maps tenants of your application
// to their Slack credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration sends a Direct Message to the Slack user associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('instance:get'), async (ctx) => {
  // Create a Slack client pre-configured with credentials necessary to communicate with your tenant's Slack workspace.
  // For the Slack SDK documentation, see https://slack.dev/node-slack-sdk/web-api.
  const slackClient = await integration.tenant.getSdkByTenant(ctx, 'slackConnector', ctx.params.tenantId);

  // Get the Slack user ID associated with your tenant
  const slackUserId = slackClient.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Slack user
  const result = await slackClient.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: slackUserId,
  });

  ctx.body = { message: `Successfully sent a message to Slack user ${slackUserId}!` };
});

// This endpoint lists Slack users of the workspace associated with your tenant.
router.get('/api/tenant/:tenantId/users', integration.middleware.authorizeUser('instance:get'), async (ctx) => {
  const slackClient = await integration.tenant.getSdkByTenant(ctx, 'slackConnector', ctx.params.tenantId);

  const result = await slackClient.users.list();

  ctx.body = result;
});

// This event handler responds to messages in channels that the bot has access to
router.on('/:componentName/message', async (ctx) => {
  const slackClient = await integration.service.getSdk(ctx, ctx.params.componentName, ctx.req.body.instanceIds[0]);

  const messagingUser = ctx.req.body.data.event.user;
  const authorizedListeningUser = ctx.req.body.data.authorizations[0].user_id;

  if (messagingUser === authorizedListeningUser) {
    console.log('no recursive response');
    return;
  }

  const text = ctx.req.body.data.event.text;
  slackClient.chat.postMessage({
    text: `I'm responding via a webhook.  I was alerted when <@${messagingUser}> sent the message: \n\n "${text}"`,
    channel: ctx.req.body.data.event.channel,
  });
});

module.exports = integration;
