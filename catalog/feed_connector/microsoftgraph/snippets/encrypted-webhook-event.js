const method = async (ctx) => {
  // Learn how subscription works https://learn.microsoft.com/en-us/graph/api/subscription-post-subscriptions
  console.log(
    `New Webhook event with resource data decrypted: ${ctx.params.eventType}`,
    ctx.req.body.data.decryptedPayload
  );
};

const code = `
/**
 * Use Fusebit's Event Handler to respond to Microsoft Graph Webhook Events with decrypted resource data
 */
 integration.event.on('/:componentName/webhook/:eventType', ${method.toString()})
  `;

module.exports = {
  name: 'Subscribe to a Webhook event with decrypted resource data',
  description:
    "Respond to Microsoft Graph Webhook Events with decrypted resource data using Fusebit's built-in event handler",
  code,
};
