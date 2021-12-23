async function discordSendMessageToChannelId(ctx, channelId, content) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await discordClient.bot.post(`channels/${channelId}/messages`, { content });
}

const code = `
/**
 * Send a message to a Discord channel identified with an Id. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param channelId {string} Channel Id
 * @param content {string} Message content
 * @returns {object} Discord response
 */
${discordSendMessageToChannelId.toString()}
`;

module.exports = {
  name: 'Send a message to channel Id',
  description: 'Send a message to a Discord channel identified with an Id.',
  code,
};
