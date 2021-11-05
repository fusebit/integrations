const { Integration } = require('@fusebit-int/framework');
const { MessageFactory } = require('botbuilder');

const integration = new Integration();

// This event handler responds to messages in channels that the bot has access to
integration.event.on('/:componentName/webhook/message', async (ctx) => {
  const { botFrameworkAdapter } = await integration.service.getSdk(
    ctx,
    ctx.params.componentName,
    'ins-00000000000000000000000000000000'
  );

  botFrameworkAdapter.processActivity(ctx.req, ctx.res, async (context) => {
    await context.sendActivity(MessageFactory.text('Hey, there. How are you doing?'));
  });
});

module.exports = integration;
