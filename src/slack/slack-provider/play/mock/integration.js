const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = '##CONNECTOR_NAME##';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  // Get the Slack user ID associated with your tenant
  const slackUserId = sdk.fusebit.credentials.authed_user.id;

  // Send a Direct Message to the Slack user
  await sdk.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: slackUserId,
  });

  ctx.body = { message: 'Message sent' };
});

integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  // Save something in storage to look up later on.
  await integration.storage.setData(ctx, `/test/slack/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
