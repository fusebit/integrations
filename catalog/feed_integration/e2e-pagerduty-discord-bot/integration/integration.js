const { Integration } = require('@fusebit-int/framework');
const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

const discordConnector = 'discordConnector';
const pagerDutyConnector = 'pagerdutyConnector';

router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const discordClient = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);
  const { id, username, avatar } = await discordClient.user.get('users/@me');
  ctx.body = {
    id,
    username,
    avatar,
  };
});

// Respond to a Slash command
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const pagerdutyClient = await integration.service.getSdk(ctx, pagerDutyConnector, ctx.req.body.installIds[0]);

  const {
    data: { data: event },
  } = ctx.req.body;

  console.log('received event', event);

  const {
    data: { application_id, token },
  } = ctx.req.body;

  // If there is no interaction object, then it's the top level message and we need to send a followup message to get more information
  // if there is an interaction object, then we are ok to proceed and

  if (!ctx.req.body.data.hasOwnProperty('message')) {
    // they are nested options objects due to the command structure being grouped.
    //should programmatically go deep until we find the name 'create' and type '3'
    incident_title = event.options[0].options[0].options[0].value;
    incident_description = event.options[0].options[0].options[1].value;

    const pdServices = await pagerdutyClient.get('/services');
    const service_details = pdServices.data.services.map((service) => ({
      label: service.name,
      value: `{"title": "${incident_title}", "description": "${incident_description}", "serviceid":"${service.id}"}`,
    }));

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
    //createIncidentandRespond(application_id, token, pagerdutyClient);
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

    // consider adding details on the person who is on call and a link to the incident
    await superagent.patch(`https://discord.com/api/v8/webhooks/${application_id}/${token}/messages/@original`).send({
      content: `${createIncident.data.incident.title} has been created!`,
    });
  }
});

// Create a new slash command in a specific Guild
//https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
router.post(
  '/api/tenant/:tenantId/:guild/slash-command',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    const discordSdk = await integration.tenant.getSdkByTenant(ctx, discordConnector, ctx.params.tenantId);
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

    const response = await discordSdk.bot.post(
      `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/guilds/${ctx.params.guild}/commands`,
      //if you want to post globally: `/v8/applications/${discordSdk.fusebit.credentials.applicationId}/commands`,
      command
    );
    ctx.body = response;
  }
);

module.exports = integration;
