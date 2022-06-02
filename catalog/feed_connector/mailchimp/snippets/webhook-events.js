const code = `
/**
 * Use Fusebit's Event Handler to respond to Mailchimp Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Subscribe to Webhook events (learn more at https://mailchimp.com/developer/transactional/docs/webhooks/)
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const {
    data: { data: event },
  } = ctx.req.body;

  const mailchimpClient = await integration.tenant.getSdk(
    ctx,
    '<% connectorName %>',
    ctx.req.body.installIds[0]
  );

  // Ping the marketing API
  const response = await mailchimpClient.marketing.ping.get();

  console.log('received a webhook event', event);
  console.log('When pinging the Mailchimp Marketing API\'s ping endpoint, the server responded:', response);
 });
 

`;

module.exports = {
  name: 'Respond to Mailchimp Webhook Events',
  description: "Respond to Mailchimp Webhook Events using Fusebit's built-in event handler",
  code,
};
