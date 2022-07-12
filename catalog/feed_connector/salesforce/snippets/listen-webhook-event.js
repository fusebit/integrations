const code = `
/**
 * Use Fusebit's Event Handler to listen to Salesforce Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Listen to Salesforce Webhook events
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => { 
  // Tip: Inspect the full body of the request to see associated Installs information
  console.log(\`New Webhook event: <@\${ctx.req.body.eventType}> \`, ctx.req.body.data);
});

`;

module.exports = {
  name: 'Listen to Salesforce Webhook Events',
  description: `Listen to Salesforce Webhook Events using Fusebit's built-in event handler`,
  code,
};
