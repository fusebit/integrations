const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'slackConnector';

// Test Endpoint: Send a Direct Message to the Slack user associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const slackClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://slack.dev/node-slack-sdk/web-api
  const slackUserId = slackClient.fusebit.credentials.authed_user.id;

  const result = await slackClient.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: slackUserId,
  });

  ctx.body = { message: `Success! Sent a message to Slack user ${slackUserId}!` };
});

//  Endpoint for Sample App: Send a message to Slack
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const slackClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const slackUserId = slackClient.fusebit.credentials.authed_user.id;

  const taskMessage = `New Task Added! \nTask Name: ${ctx.req.body.taskName} \nTask Detail: ${ctx.req.body.taskDetail}`;

  const result = await slackClient.chat.postMessage({
    text: taskMessage,
    channel: slackUserId,
  });

  ctx.body = { message: `Successfully sent a message to Slack user ${slackUserId}!` };
});

module.exports = integration;
