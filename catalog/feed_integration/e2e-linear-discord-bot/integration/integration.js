// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');
const integration = new Integration();
const router = integration.router;
const connectorName = 'discordConnector';
const linearConnector = 'linearConnector';

// Test Endpoint to demonstrate how to connect to your Discord App
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const linearClient = await integration.tenant.getSdkByTenant(ctx, linearConnector, ctx.params.tenantId);

  // List all the Linear issues assigned to me.
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  const message = `You have ${myIssues.nodes.length} issues assigned to you`;
  await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
    content: message,
  });

  ctx.body = 'Message posted successfully to Discord!';
});

// Configure a new Slash Command for the Discord Bot
// Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
const configureSlashCommand = () => {
  const command = {
    name: 'linear',
    description: 'Linear Commands',
    options: [
      {
        name: 'issue',
        description: 'Issue related commands',
        type: 2,
        options: [
          {
            name: 'create',
            description: 'Create new Linear Issue',
            type: 1,
            options: [
              {
                name: 'title',
                description: 'Issue Title',
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
};

// Register a new Slash Command in a specific Guild
// How to Retrieve your Guild ID: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
router.post(
  '/api/tenant/:tenantId/:guild/slash-command',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
    const command = configureSlashCommand();

    // Learn more about registering commands
    // https://discord.com/developers/docs/interactions/application-commands#registering-a-command
    const response = await discordClient.bot.post(
      `/v8/applications/${discordClient.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
      command
    );
    ctx.body = response;
  }
);

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

// Handle the values from the Slash Command
const getSlashCommandValues = (event) => {
  // The registered Slash Command is three levels deep
  const [title] = event?.options[0]?.options[0]?.options;
  return { issueTitle: title.value };
};

// Listen to and Respond to a Slash Command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const linearClient = await integration.service.getSdk(ctx, linearConnector, ctx.req.body.installIds[0]);
  const {
    data: { data: event, application_id, token },
  } = ctx.req.body;

  // If there is no message object, then it's the top level message and we can send a followup message to get more information
  // If there is a message object, then we can assume it's the followup message with more details
  // Read more about interactions here: https://discord.com/developers/docs/interactions/receiving-and-responding

  if (!ctx.req.body.data.hasOwnProperty('message')) {
    const { issueTitle } = getSlashCommandValues(event);
    const linearTeams = await linearClient.teams();

    const teamNames = linearTeams.nodes.map((team) => ({
      label: team.name,
      value: JSON.stringify({
        title: issueTitle,
        teamid: team.id,
      }),
    }));

    // Send back a drop-down list to select the service from
    await superagent.post(`https://discord.com/api/v8/webhooks/${application_id}/${token}`).send({
      content: 'What team is this issue for?',
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'linear_teams',
              options: teamNames,
              placeholder: 'Choose one',
              min_values: 1,
              max_values: 1,
            },
          ],
        },
      ],
    });
  } else {
    const values = JSON.parse(event.values);
    let content = '';
    try {
      // Create Issue with the received details from the followup message
      const data = { title: values.title, description: values.description, teamId: values.teamid };

      const { _issue } = await linearClient.issueCreate(data);
      const linearIssue = await linearClient.issue(_issue.id);

      content = `Issue created: ${linearIssue.url}`;
    } catch (e) {
      content = `Incident creation failed, reason: ${e.message}`;
    }

    await superagent
      .patch(`https://discord.com/api/v8/webhooks/${application_id}/${token}/messages/@original`)
      .send({ content });
  }
});

module.exports = integration;
