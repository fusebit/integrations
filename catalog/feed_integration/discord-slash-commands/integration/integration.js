// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
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
function configureSingleSlashCommand() {
  const command = {
    name: 'command',
    description: 'Command that gets triggered',
    type: 1,
    options: [
      {
        name: 'parameterone',
        description: 'First parameter of the Command',
        type: 3,
        required: true,
      },
      {
        name: 'parametertwo',
        description: 'Second parameter of the Command',
        type: 3,
        required: true,
      },
    ],
  };
  return command;
}

// Configure a new Slash Command for the Discord Bot
// Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
function configureNestedSlashCommand() {
  const command = {
    name: 'toplevelcommand',
    description: 'Top Level Command',
    options: [
      {
        name: 'subcommand',
        description: 'Sub Command that gets triggered',
        type: 1,
        options: [
          {
            name: 'parameterone',
            description: 'First parameter of the Sub Command',
            type: 3,
            required: true,
          },
          {
            name: 'parametertwo',
            description: 'Second parameter of the Sub Command',
            type: 3,
            required: true,
          },
        ],
      },
    ],
  };

  return command;
}

// Configure a new Slash Command for the Discord Bot
// Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
function configureGroupedSlashCommand() {
  const command = {
    name: 'toplevelcommand',
    description: 'Top Level Command',
    options: [
      {
        name: 'subcommandgroup',
        description: 'Sub Command Group',
        type: 2,
        options: [
          {
            name: 'subcommand',
            description: 'Sub Command that gets triggered',
            type: 1,
            options: [
              {
                name: 'parameterone',
                description: 'First parameter of the Sub Command',
                type: 3,
                required: true,
              },
              {
                name: 'parametertwo',
                description: 'Second parameter of the Sub Command',
                type: 3,
                required: true,
              },
            ],
          },
        ],
      },
    ],
  };

  return command;
}

// Register a new Slash Command in a specific Guild
// How to Retrieve your Guild ID: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
router.post(
  '/api/tenant/:tenantId/:guild/slash-command',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordSdk = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);
    const command = slashCommandConfiguration();

    // Learn more about registering commands
    // https://discord.com/developers/docs/interactions/application-commands#registering-a-command
    const response = await discordSdk.bot.post(
      `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
      command
    );
    ctx.body = response;
  }
);

// Register a new Slash Command globally
router.post('/api/tenant/:tenantId/slash-command', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordSdk = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);
  const command = slashCommandConfiguration();

  // Learn more about registering commands
  // https://discord.com/developers/docs/interactions/application-commands#registering-a-command
  const response = await discordSdk.bot.post(
    `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/commands`,
    command
  );
  ctx.body = response;
});
module.exports = integration;
