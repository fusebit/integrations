async function discordGetChannelByName(ctx, guildId, channelName) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const channels = await discordClient.bot.get(`guilds/${guildId}/channels`);
  const channel = channels.find((c) => c.name === channelName);
  return channel;
}

const code = `
/**
 * Find a Discord channel by name. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param guildId {string} Guild Id
 * @param channelName {string} Channel name
 * @returns {object|undefined} Discord channel if found
 */
${discordGetChannelByName.toString()}
`;

module.exports = {
  name: 'Find channel by name',
  description: 'Find a Discord channel by name.',
  code,
};
