const method = async (ctx) => {
  // Learn how subscription works https://learn.microsoft.com/en-us/graph/api/subscription-post-subscriptions
  console.log(`New Webhook event ${ctx.params.eventType}`, ctx.req.body.data);
};

const code = `
/**
 * Use Fusebit's Event Handler to respond to Microsoft Graph Webhook Events
 */
 integration.event.on('/:componentName/webhook/:eventType', ${method.toString()})
  `;

module.exports = {
  name: 'Subscribe to a Webhook event',
  description: "Respond to Microsoft Graph Webhook Events using Fusebit's built-in event handler",
  code,
};
