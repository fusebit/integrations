const code = `
/**
 * Use Fusebit's Event Handler to respond to PagerDuty Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Subscribe to Webhook events
 integration.event.on('/:pagerdutyConnector/webhook/:eventType', async (ctx) => {
  const { resource_type, data } = ctx.req.body.data.event;
  const { title, urgency, html_url, status } = data

  const pagerdutyClient = await integration.tenant.getSdk(
    ctx,
    '<% connectorName %>',
    ctx.req.body.installIds[0]
  );
  
  ctx.body = {
     message: ${`Got a status update of ${status} for a resource of type ${resource_type} with title ${title} with priority ${urgency}, View details at ${html_url}`}
   };
 });
`;

module.exports = {
  name: 'Respond to PagerDuty Webhook Events',
  description: "Respond to PagerDuty Webhook Events using Fusebit's built-in event handler",
  code,
};
