const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'discordConnector';

// Test Endpoint: Get User Object of Tenant's Discord Account and Send a Message
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://discord.com/developers/docs/reference
  const { id, username, avatar } = await discordClient.user.get('users/@me');
  console.log('Success!');

  // Send a message using the Discord Channel Webhook
  await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
    content: `Hello from Fusebit! Here is your ${id}, this is your ${username}.`,
  });
});

module.exports = integration;
