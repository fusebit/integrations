// In order to use the code provided by this integration template, you _must_
// configure the Microsoft Bot Framework Connector with your own bot app credentials FIRST
//
// Read through the integration guide to get started: https://developer.fusebit.io/docs/microsoft-teams-bot

const { Integration } = require('@fusebit-int/framework');
const { MessageFactory, TurnContext } = require('botbuilder');

const integration = new Integration();
const connectorName = 'microsoftBotFrameworkConnector';

// Koa Router: https://koajs.com/
const router = integration.router;

// Test Endpoint: Proactively sends a message to the user that previously initiated a conversation.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const botFrameworkAdapter = await integration.service.getSdk(ctx, connectorName);

  const { tenantId } = ctx.params;
  const { data: conversationReference } = await integration.storage.getData(
    ctx,
    `/${tenantId}/teams-conversation-reference`
  );

  if (!conversationReference) {
    ctx.throw(`Unable to send a proactive message. Has ${tenantId} sent this bot a message yet?`);
  }

  // API Reference: https://www.npmjs.com/package/botbuilder
  await botFrameworkAdapter.continueConversation(conversationReference, async (context) => {
    await context.sendActivity("Hi again, friend. This is a proactive message I'm sending you.");
  });

  ctx.body = { message: `Success! You sent a proactive message to the Microsoft Teams user!` };
});

// Do not remove! This is required logic responsible to handle incoming messages from a Microsoft Teams user
integration.event.on('/:componentName/webhook/message', async (ctx) => {
  const botFrameworkAdapter = await integration.service.getSdk(ctx, ctx.params.componentName);

  await botFrameworkAdapter.processActivity(ctx.req, ctx.res, async (context) => {
    const conversationReference = TurnContext.getConversationReference(context.activity);
    const tenantId = 'user-1';
    await integration.storage.setData(ctx, `/${tenantId}/teams-conversation-reference`, {
      data: conversationReference,
    });

    const reply = MessageFactory.text(
      "Hi, friend. I'm saving a conversation reference so I can send you a proactive message later."
    );
    await context.sendActivity(reply);
  });
});

module.exports = integration;
