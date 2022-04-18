const code = `
/**
 * Use Fusebit's Event Handler to respond to Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Subscribe to Webhook events (learn more at https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
   console.log('webhook received: ', ctx.req.body.data);
 });
 

`;

module.exports = {
  name: 'Respond to Gitlab Webhook Events',
  description: "Respond to Gitlab Webhook Events using Fusebit's built-in event handler",
  code,
};
