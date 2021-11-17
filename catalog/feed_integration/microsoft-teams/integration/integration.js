// Fusebit Microsoft Teams Integration
//
// Note, to be able to use the code provided by this integration template, you _must_
// configure the Microsoft Bot Framework Connector with your own bot app credentials, and you _must_
// configure the messaging endpoint of this app to point to the webhook url of the connector.
//
// Once you have that in place, you will be able to test this integration template as follows:
//
// 1. If you haven't already, install your bot application in a Microsoft Teams workspace.
// 2. Send your bot application a message through that workspace.
// 3. Hit the run button on Fusebit's dashboard to trigger a proactive message.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
const { MessageFactory, TurnContext } = require('botbuilder');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;

// This is the logic responsible for handling the incoming messages from a Microsoft Teams user.
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

// This is the logic that proactively sends a message to the user that previously initiated a conversation.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const botConnector = 'microsoftBotFrameworkConnector';
  const botFrameworkAdapter = await integration.service.getSdk(ctx, botConnector);

  const { tenantId } = ctx.params;
  const { data: conversationReference } = await integration.storage.getData(
    ctx,
    `/${tenantId}/teams-conversation-reference`
  );

  if (!conversationReference) {
    ctx.throw(`Unable to send a proactive message. Has ${tenantId} sent this bot a message yet?`);
  }

  await botFrameworkAdapter.continueConversation(conversationReference, async (context) => {
    await context.sendActivity("Hi again, friend. This is a proactive message I'm sending you.");
  });

  ctx.body = { message: `Successfully sent a proactive message to the Microsoft Teams user!` };
});

module.exports = integration;
