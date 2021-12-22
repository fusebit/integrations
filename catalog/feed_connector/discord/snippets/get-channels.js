async function discordGetChannels(ctx, guildId) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const channels = await discordClient.bot.get(`guilds/${guildId}/channels`);
  return channels;
}

const code = `
/**
 * Get the Discord channels in a guild. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param guildId {string} Guild Id
 * @returns {Array} Discord channels
 */
${discordGetChannels.toString()}
`;

module.exports = {
  name: 'Get Discord channels',
  description: 'Get the Discord channels in a guild.',
  code,
};
