async function discordSendMessageToChannelName(ctx, guildId, channelName, content) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const channels = await discordClient.bot.get(`guilds/${guildId}/channels`);
  const channel = channels.find((c) => c.name === channelName);
  if (!channel) {
    ctx.throw(404, `Channel '${channelName}' not found`);
  }
  return await discordClient.bot.post(`channels/${channel.id}/messages`, { content });
}

const code = `
/**
 * Send a message to a Discord channel identified by name. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param guildId {string} Guild Id
 * @param channelName {string} Channel name
 * @param content {string} Message content
 * @returns {object} Discord response
 */
${discordSendMessageToChannelName.toString()}
`;

module.exports = {
  name: 'Send a message to a named channel',
  description: 'Send a message to a Discord channel identified by name.',
  code,
};
