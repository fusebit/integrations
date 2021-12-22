const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

const discordConnector = 'discordConnector';
const pagerDutyConnector = 'pagerdutyConnector';

//Test Endpoint to demonstrate how to retrieve information from PagerDuty and send it to Discord
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const pagerdutyClient = await integration.tenant.getSdkByTenant(ctx, pagerDutyConnector, ctx.params.tenantId);
  const discordClient = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);

  const sinceDate = new Date();
  const days = 7;
  sinceDate.setDate(sinceDate.getDate() - days);

  const incidents = await pagerdutyClient.get(`/incidents?statuses[]=triggered&since=${sinceDate}`);

  await superagent.post(discordClient.fusebit.credentials.webhook.url).send({
    content: `There have been ${incidents.resource.length} incidents triggered in the last ${days} days.`,
  });
  ctx.body = 'Message posted successfully to Discord!';
});

// Webhook that listens to & responds to incoming messages
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const pagerdutyClient = await integration.service.getSdk(ctx, pagerDutyConnector, ctx.req.body.installIds[0]);

  const {
    data: { data: event, application_id, token },
  } = ctx.req.body;

  // If there is no interaction object, then it's the top level message and we need to send a followup message to get more information
  // if there is an interaction object, then we are ok to proceed and perform the final action
  // Read more about interactions here: https://discord.com/developers/docs/interactions/receiving-and-responding

  if (!ctx.req.body.data.hasOwnProperty('message')) {
    // The registered slash command is three levels deep
    incident_title = event?.options[0]?.options[0]?.options[0]?.value;
    incident_description = event?.options[0]?.options[0]?.options[1]?.value;

    // Get list of Services from PagerDuty
    const pdServices = await pagerdutyClient.get('/services');
    const service_details = pdServices.data.services.map((service) => ({
      label: service.name,
      value: JSON.stringify({
        title: incident_title,
        description: incident_description,
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
              options: service_details,
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
    const createIncident = await pagerdutyClient.post('/incidents', {
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

    // consider adding more details on the person who is on call and a link to the incident
    await superagent.patch(`https://discord.com/api/v8/webhooks/${application_id}/${token}/messages/@original`).send({
      content: `${createIncident.data.incident.title} has been created!`,
    });
  }
});

// Create a new slash command in a specific Guild
router.post(
  '/api/tenant/:tenantId/:guild/slash-command',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordSdk = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);

    //Create your Slash Command with the Discord Bot
    //Learn more: https://discord.com/developers/docs/interactions/application-commands#slash-commands
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

    // Using the Discord Bot SDK requires an Application ID, Application Bot Token,
    // and the 'applications.commands' scope in the Connector configuration.
    if (!discordSdk.fusebit.credentials.applicationId) {
      ctx.throw(404, 'Application Id not found');
    }

    //if you want to post globally instead of guild specific: `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/commands`,
    //learn more about registering commands here: https://discord.com/developers/docs/interactions/application-commands#registering-a-command
    const response = await discordSdk.bot.post(
      `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
      command
    );
    ctx.body = response;
  }
);

module.exports = integration;
