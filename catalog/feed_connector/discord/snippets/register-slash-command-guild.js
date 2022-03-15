const code = `
/**
 * Register a Slash Command with Discord to a Specific Guild
 * 
 * @param tenantId {tenantId} Tenant Id
 * @param guild {guild} Discord Guild Id
 */

 // Create a new slash command in a specific Guild
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
  name: 'Register Slash Commands to a Guild',
  description: 'Register Slash Commands to a Guild',
  code,
};
