async function microsoftbotframeworkCreateNewConversation(ctx, conversationMessage) {
  // For the Microsoft Bot Framework SDK documentation, see https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest#botbuilder-botframeworkadapter-createconversation
  const botFrameworkAdapter = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { tenantId } = ctx.params;
  const { data: conversationReference } = await integration.storage.getData(
    ctx,
    `/${tenantId}/teams-conversation-reference`
  );

  if (!conversationReference) {
    ctx.throw(`Unable to find a conversation. Has ${tenantId} sent this bot a message yet?`);
  }

  return await botFrameworkAdapter.createConversation(conversationReference, async (context) => {
    await context.sendActivity(conversationMessage);
  });
}

const code = `
/**
 * Asynchronously creates and starts a conversation with a user on a channel
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @paramt conversationMessage {string} Message to send in new conversation
 */
${microsoftbotframeworkCreateNewConversation.toString()}
`;

module.exports = {
  name: 'Starts a new conversation with a user on a channel',
  description: 'Starts a new conversation with a user on a channel. The bot must be pre-authenticated first.',
  code,
};
