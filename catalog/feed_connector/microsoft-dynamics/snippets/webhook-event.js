const method = async (ctx) => {
  // Learn how to register webhooks for Microsoft Dynamics https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/download-tools-nuget?view=op-9-1
  console.log(`New Webhook event ${ctx.params.eventType}`, ctx.req.body.data);
};

const code = `
/**
 * Use Fusebit's Event Handler to respond to Microsoft Dynamics Webhook Events
 */
 integration.event.on('/:componentName/webhook/:eventType', ${method.toString()})
  `;

module.exports = {
  name: 'Subscribe to a Webhook event',
  description: "Respond to Microsoft Dynamics Webhook Events using Fusebit's built-in event handler",
  code,
};
