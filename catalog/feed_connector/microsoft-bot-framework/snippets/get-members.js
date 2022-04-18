async function microsoftbotframeworkGetMembers(ctx) {
  // For the Microsoft Bot Framework SDK documentation, see https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest#botbuilder-botframeworkadapter-getconversationmembers
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
    ctx.throw(`Unable to find the conversation. Has ${tenantId} sent this bot a message yet?`);
  }

  return await botFrameworkAdapter.getConversationMembers(conversationReference);
}

const code = `
/**
 * Get the list of members in a conversation
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${microsoftbotframeworkGetMembers.toString()}
`;

module.exports = {
  name: 'Get the list of members in a conversation',
  description: 'Get the list of members in a conversation',
  code,
};
