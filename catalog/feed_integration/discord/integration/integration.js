// Fusebit Discord Integration
//
// This simple Discord integration allows you to call Discord APIs on behalf of the tenants of your
// application. Fusebit manages the Discord authorization process and maps tenants of your application
// to their Discord credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;
const connectorName = 'discordConnector';

// The sample test endpoint of this integration returns the user object of the requester's user in the Discord account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Discord client pre-configured with credentials necessary to communicate with your tenant's Discord account.
  // For the Discord API documentation, see https://discord.com/developers/docs/reference.
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const { id, username, avatar } = await discordClient.user.get('users/@me');
  ctx.body = {
    id,
    username,
    avatar,
  };
});

// List Guild channels
router.get(
  '/api/tenant/:tenantId/guilds/:guildId/channels',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
    const guildChannels = await discordClient.bot.get(`guilds/${ctx.params.guildId}/channels`);
    ctx.body = guildChannels;
  }
);

// If your Discord application uses the webhook.incoming scope, you can use the created webhook with token and
// post to the authorized channel.
router.post(
  '/api/tenant/:tenantId/webhook/message',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
    await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
      content: ctx.req.body.message || 'Hello world from Fusebit!',
    });
    ctx.body = 'Message posted successfully';
  }
);

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
    // Ensure you have the Application Id properly configured in your Discord connector settings.
    // The application needs to authorize the applications.commands scope in order to create slash commands.
    // You will need to use a bot token, ensure you provide a Discord Application Bot Token.

    if (!discordSdk.fusebit.credentials.applicationId) {
      ctx.throw(404, 'Application Id not found');
    }

    const response = await discordSdk.bot.post(
      `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
      command
    );
    ctx.body = response;
  }
);

// Create a new global slash command
router.post('/api/tenant/:tenantId/slash-command', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordSdk = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const command = {
    name: 'ping',
    type: 1,
    description: 'Ping slash commmand example',
  };

  // Ensure you have the Application Id properly configured in your Discord connector settings.
  // The application needs to authorize the applications.commands scope in order to create slash commands.
  // You will need to use a bot token, ensure you provide a Discord Application Bot Token.
  const response = await discordSdk.bot.post(
    `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/commands`,
    command
  );
  ctx.body = response;
});

// Respond to a Slash command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const {
    data: { data: event },
  } = ctx.req.body;
  console.log('received event', event);
  const {
    data: { application_id, token },
  } = ctx.req.body;
  /**
   * You can use the following endpoints to edit your initial response or send followup messages:
    PATCH /webhooks/<application_id>/<interaction_token>/messages/@original to edit your initial response to an Interaction
    DELETE /webhooks/<application_id>/<interaction_token>/messages/@original to delete your initial response to an Interaction
    POST /webhooks/<application_id>/<interaction_token> to send a new followup message
    PATCH /webhooks/<application_id>/<interaction_token>/messages/<message_id> to edit a message sent with that token
   */
  await superagent.post(`https://discord.com/api/v8/webhooks/${application_id}/${token}`).send({
    content: 'It works!',
  });
});

module.exports = integration;
