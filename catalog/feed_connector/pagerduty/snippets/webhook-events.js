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

  ctx.body = {
    resource_type,
    title,
    urgency,
    html_url,
    status
  };
 });
`;

module.exports = {
  name: 'Respond to PagerDuty Webhook Events',
  description: "Respond to PagerDuty Webhook Events using Fusebit's built-in event handler",
  code,
};
