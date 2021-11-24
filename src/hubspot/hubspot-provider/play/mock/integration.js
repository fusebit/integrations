const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();
const router = integration.router;
const connectorName = '##CONNECTOR_NAME##';
const contactEmail = '##CONTACT_EMAIL##';

router.get('/api/check/:installId', async (ctx) => {
  const hubspotClient = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const contacts = await hubspotClient.crm.contacts.getAll();
  ctx.body = {
    count: contacts.length,
  };
});

router.get('/api/contact/check/:installId', async (ctx) => {
  const hubspotClient = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const contacts = await hubspotClient.crm.contacts.getAll();
  // No contacts, create one
  if (!contacts.length) {
    const createdContact = await hubspotClient.crm.contacts.basicApi.create({
      properties: {
        company: 'Fusebit',
        email: contactEmail,
        firstname: 'Daisy',
        lastname: 'Doe',
        phone: '(+1) 123456',
        website: 'fusebit.io',
      },
    });
    ctx.body = createdContact.body;
  } else {
    ctx.body = contacts[0];
  }
});

router.put('/api/contact/:installId/:contactId', async (ctx) => {
  const hubspotClient = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const updatedContact = await hubspotClient.crm.contacts.basicApi.update(ctx.params.contactId, {
    properties: {
      website: ctx.req.body.website,
    },
  });
  ctx.body = updatedContact;
});

// Listen all issues related webhooks
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  // Save something in storage to loouk up later on.
  await integration.storage.setData(ctx, `/test/${connectorName}/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
