async function discordSendMessage(ctx, content) {
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  // By default send message to the webhook channel selected during installation
  const channelId = discordClient?.fusebit?.credentials?.webhook?.channel_id;
  if (!channelId) {
    ctx.throw(404, `The installation does not have a default webhook channel.`);
  }
  return await discordClient.bot.post(`channels/${channelId}/messages`, { content });
}

const code = `
/**
 * Send a message to the default webhook channel on Discord. This function requires a custom Discord app with send message 
 * bot permission, see https://developer.fusebit.io/docs/discord#creating-your-own-discord-app.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param content {string} Message content
 * @returns {object} Discord response
 */
${discordSendMessage.toString()}
`;

module.exports = {
  name: 'Send a message to the default channel',
  description: 'Send a message to the default webhook channel on Discord.',
  code,
};
