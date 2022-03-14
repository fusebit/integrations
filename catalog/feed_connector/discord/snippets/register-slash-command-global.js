const code = `
/**
 * Register a Slash Command with Discord Globally
 * 
 * @param tenantId {tenantId} Tenant Id
 */

 // Create a new global command. New global commands will be available in all guilds after 1 hour.
 router.post(
  '/api/tenant/:tenantId/:guild/slash-command',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordSdk = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
    const command = {
      name: 'ping',
      type: 1,
      description: 'Ping slash commmand example',
    };

    // Using the Discord Bot SDK requires an Application ID, Application Bot Token,
    // and the 'applications.commands' scope in the Connector configuration.
    if (!discordSdk.fusebit.credentials.applicationId) {
      ctx.throw(404, 'Application Id not found');
    }

    const response = await discordSdk.bot.post(
      \`/v8/applications/\${discordSdk.fusebit.credentials.applicationId}/commands\`,
      command
    );
    ctx.body = response;
  }
);

`;

module.exports = {
  name: 'Register Slash Commands Globally',
  description: 'Register Slash Commands Globally',
  code,
};
