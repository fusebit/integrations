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

// This event handler responds to interactions events
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('Command received', data);
});

module.exports = integration;
