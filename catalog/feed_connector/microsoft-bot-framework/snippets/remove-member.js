async function microsoftbotframeworkRemoveMember(ctx, memberId) {
  // For the Microsoft Bot Framework SDK documentation, see https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest#botbuilder-botframeworkadapter-deleteconversationmember
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

  return await botFrameworkAdapter.deleteConversationMember(conversationReference, memberId);
}

const code = `
/**
 * Remove a member from a conversation
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param memberId {string} Member ID to remove from Conversation
 */
${microsoftbotframeworkRemoveMember.toString()}
`;

module.exports = {
  name: 'Remove a member from a conversation',
  description: 'Remove a member from a conversation',
  code,
};
