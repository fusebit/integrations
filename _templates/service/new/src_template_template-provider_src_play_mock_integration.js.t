---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/play/mock/integration.js
---
const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = '<%= name.toLowerCase() %>-connector';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  // TODO: Perform SDK check here
});

integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  // Save something in storage to loouk up later on.
  await integration.storage.setData(ctx, `/test/<%= name.toLowerCase() %>/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;

