const { Integration } = require('@fusebit-int/framework');
const { MessageFactory } = require('botbuilder');

const integration = new Integration();

integration.event.on('/:componentName/webhook/message', async (ctx) => {
  const botFrameworkAdapter = await integration.service.getSdk(ctx, ctx.params.componentName);

  await botFrameworkAdapter.processActivity(ctx.req, ctx.res, async (context) => {
    const reply = MessageFactory.text('Hey, friend. How are you doing today?');
    await context.sendActivity(reply);
  });
});

module.exports = integration;
