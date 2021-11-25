const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();
const router = integration.router;

const slackConnectorName = 'slackConnector';
const hubspotConnectorName = 'hubspotConnector';

router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const slackClient = await integration.tenant.getSdkByTenant(ctx, slackConnectorName, ctx.params.tenantId);
  const hubspotClient = await integration.tenant.getSdkByTenant(ctx, hubspotConnectorName, ctx.params.tenantId);

  const contact = await lookupAndPost(
    ctx.req.body.email,
    slackClient.fusebit.credentials.authed_user.id,
    slackClient,
    hubspotClient
  );

  ctx.body = contact;
});

integration.event.on('/:componentName/webhook/event_callback', async (ctx) => {
  const slackClient = await integration.service.getSdk(ctx, slackConnectorName, ctx.req.body.installIds[0]);
  const hubspotClient = await integration.service.getSdk(ctx, hubspotConnectorName, ctx.req.body.installIds[0]);

  // Parsing for "lookup <mailto:contact@fusebit.io|contact@fusebit.io>"
  const regex = new RegExp('(lookup.*<mailto:)([a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+.[a-zA-Z0-9]+)', 'g');
  const result = regex.exec(ctx.req.body.data.event.text);
  if (result) {
    await lookupAndPost(result[2], ctx.req.body.data.event.channel, slackClient, hubspotClient);
  }
});

// Looks up a HubSpot Contact by the email address specified, and posts a message
// to Slack with the details of that contact
async function lookupAndPost(email, slackChannel, slackClient, hubSpotClient) {
  const filter = { propertyName: 'email', operator: 'EQ', value: email };
  const sorts = JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' });
  const properties = [
    'createdate',
    'firstname',
    'lastname',
    'email',
    'website',
    'city',
    'country',
    'company',
    'jobtitle',
  ];
  const limit = 1;
  const after = 0;

  const result = await hubSpotClient.crm.contacts.searchApi.doSearch({
    filterGroups: [{ filters: [filter] }],
    sorts: [sorts],
    email,
    properties,
    limit,
    after,
  });
  const contact = (result.body.results[0] || {}).properties;

  if (contact) {
    slackClient.chat.postMessage({
      text: `
      :slightly_smiling_face: Name: ${contact.firstname} ${contact.lastname}
      :email: <mailto:${contact.email}|Email:> ${contact.email}
      :date: Date created: ${contact.createdate}
      :earth_americas: Location: ${contact.city}, (${contact.country})
      :computer: Job title: ${contact.jobtitle}
      :100: Company: ${contact.company}
      :link: Website: ${contact.website || 'not found'}
    `,
      channel: slackChannel,
    });
  } else {
    slackClient.chat.postMessage({ text: 'Contact not found', channel: slackChannel });
  }
  console.log('contact', contact);
}

module.exports = integration;
