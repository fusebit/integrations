async function discordGetGuilds(ctx) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const guilds = await discordClient.bot.get('users/@me/guilds');
  return guilds;
}

const code = `
/**
 * Get the Discord guilds the bot is a member of. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {Array} Discord guilds
 */
${discordGetGuilds.toString()}
`;

module.exports = {
  name: 'Get Discord guilds',
  description: 'Get the Discord guilds the bot is a member of.',
  code,
};
