const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = '##CONNECTOR_ID##';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);

  // Send a message to random, where the bot can listen
  await sdk.chat.postMessage({
    text: 'Hello world from Fusebit!',
    channel: 'random',
  });

  ctx.body = { message: 'Message sent' };
});

integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  // Save something in storage to look up later on.
  await integration.storage.setData(ctx, `/test/${connectorName}/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
