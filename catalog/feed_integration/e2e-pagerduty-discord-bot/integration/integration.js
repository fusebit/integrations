const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

const discordConnector = 'discordConnector';
const pagerDutyConnector = 'pagerdutyConnector';

// Test Endpoint to demonstrate how to retrieve information from PagerDuty and send it to Discord
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, pagerDutyConnector, ctx.params.tenantId);
  const discordClient = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);

  const sinceDate = new Date();
  const days = 7;
  sinceDate.setDate(sinceDate.getDate() - days);

  const incidents = await pagerdutyClient.get(`/incidents?statuses[]=triggered&since=${sinceDate}`);

  const { id, username } = await discordClient.user.get('users/@me');
  const directMessage = await discordClient.bot.post('users/@me/channels', {
    recipient_id: id,
  });
  await discordClient.bot.post(`channels/${directMessage.id}/messages`, {
    content: `There have been ${incidents.resource.length} incidents triggered in the last ${days} days.`,
  });

  ctx.body = { message: `Successfully sent a message to Discord user ${username}!` };
});

// Configure a new Slash Command for the Discord Bot
// Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
function slashCommandConfiguration() {
  const command = {
    name: 'pd',
    description: 'PagerDuty Commands',
    options: [
      {
        name: 'incident',
        description: 'Incident related commands',
        type: 2,
        options: [
          {
            name: 'create',
            description: 'Create new PD Incident',
            type: 1,
            options: [
              {
                name: 'title',
                description: 'Incident Title',
                type: 3,
                required: true,
              },
              {
                name: 'description',
                description: 'Short Description of the Issue',
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

// Listen to and Respond to a Slash Command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const pagerdutyClient = await integration.service.getSdk(ctx, pagerDutyConnector, ctx.req.body.installIds[0]);

  const {
    data: { data: event, application_id, token },
  } = ctx.req.body;

  // If there is no message object, then it's the top level message and we can send a followup message to get more information
  // If there is a message object, then we can assume it's the followup message with more details
  // Read more about interactions here: https://discord.com/developers/docs/interactions/receiving-and-responding

  if (!ctx.req.body.data.hasOwnProperty('message')) {
    const { incidentTitle, incidentDescription } = getSlashCommandValues(event);

    // Get list of Services from PagerDuty
    const pdServices = await pagerdutyClient.get('/services');
    const serviceDetails = pdServices.data.services.map((service) => ({
      label: service.name,
      value: JSON.stringify({
        title: incidentTitle,
        description: incidentDescription,
        serviceid: service.id,
      }),
    }));

    // Send back a drop-down list to select the service from
    await superagent.post(`https://discord.com/api/v8/webhooks/${application_id}/${token}`).send({
      content: 'What service is this incident for?',
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'pd_services',
              options: serviceDetails,
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
      // Create Incident with the received details from the followup message
      const createdIncident = await pagerdutyClient.post('/incidents', {
        data: {
          incident: {
            type: 'incident',
            title: values.title,
            service: {
              id: values.serviceid,
              type: 'service',
            },
            body: {
              type: 'incident_body',
              details: values.description,
            },
          },
        },
      });
      // Consider adding more details on the person who is on call and a link to the incident
      content = `${createdIncident.data.incident.title} has been created!`;
    } catch (e) {
      content = `Incident creation failed, reason: ${e.message}`;
    }

    await superagent
      .patch(`https://discord.com/api/v8/webhooks/${application_id}/${token}/messages/@original`)
      .send({ content });
  }
});

// Handle the values from the Slash Command
function getSlashCommandValues(event) {
  // The registered Slash Command is three levels deep
  const [title, description] = event?.options[0]?.options[0]?.options;
  return { incidentTitle: title.value, incidentDescription: description.value };
}

module.exports = integration;
