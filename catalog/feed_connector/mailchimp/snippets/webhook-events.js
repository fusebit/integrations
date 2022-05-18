const code = `
/**
 * Use Fusebit's Event Handler to respond to Mailchimp Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Subscribe to Webhook events (learn more at https://mailchimp.com/developer/transactional/docs/webhooks/)
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
   console.log('webhook received: ', ctx.req.body.data);
 });
 

`;

module.exports = {
  name: 'Respond to Mailchimp Webhook Events',
  description: 'Respond to Mailchimp Webhook Events using Fusebit's built-in event handler',
  code,
};
