async function discordGetMe(ctx) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const me = await discordClient.bot.get('users/@me');
  return me;
}

const code = `
/**
 * Get details of the Discord bot user. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {object} Discord bot user
 */
${discordGetMe.toString()}
`;

module.exports = {
  name: 'Get bot user',
  description: 'Get details of the Discord bot user.',
  code,
};
