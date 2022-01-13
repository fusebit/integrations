// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');
const integration = new Integration();
const router = integration.router;
const connectorName = 'discordConnector';

// Test Endpoint to demonstrate how to connect to your Discord App
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
    content: `Hello from Fusebit!`,
  });

  ctx.body = 'Message posted successfully to Discord!';
});

// Configure a new Slash Command for the Discord Bot
// Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
const configureSlashCommand = () => {
  const command = {
    name: 'command',
    description: 'Command that gets triggered',
    type: 1,
    options: [
      {
        name: 'parameterOne',
        description: 'First parameter of the Command',
        type: 3,
        required: true,
      },
      {
        name: 'parameterTwo',
        description: 'Second parameter of the Command',
        type: 3,
        required: true,
      },
    ],
  };
  return command;
};

// Register a new Slash Command in a specific Guild
// How to Retrieve your Guild ID: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
router.post('/api/tenant/:tenantId/slash-command', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const command = configureSlashCommand();

  // Learn more about registering commands
  // https://discord.com/developers/docs/interactions/application-commands#registering-a-command
  const response = await discordClient.bot.post(
    `/v8/applications/${discordClient.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
    command
  );
  ctx.body = response;
});

// Register a new Slash Command globally
router.post('/api/tenant/:tenantId/slash-command', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const command = configureSlashCommand();

  // Learn more about registering commands
  // https://discord.com/developers/docs/interactions/application-commands#registering-a-command
  const response = await discordClient.bot.post(
    `/v8/applications/${discordClient.fusebit.credentials.applicationId}/commands`,
    command
  );
  ctx.body = response;
});

// Listen to and Respond to a Slash Command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const {
    data: { data: event, application_id, token },
  } = ctx.req.body;

  // Retrieve the parameters and handle them
  const [parameterOne, parameterTwo] = event.options;
  const responseMessage = `You sent me ${parameterOne.value} and ${parameterTwo.value} as your parameters!`;

  // Send back a message to respond
  // Read more about interactions here: https://discord.com/developers/docs/interactions/receiving-and-responding
  await superagent
    .post(`https://discord.com/api/v8/webhooks/${application_id}/${token}`)
    .send({ content: responseMessage });
});

module.exports = integration;
