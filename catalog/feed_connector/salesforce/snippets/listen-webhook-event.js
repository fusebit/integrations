const code = `
/**
 * Use Fusebit's Event Handler to listen to Salesforce Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Listen to Salesforce Webhook events
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => { 

  // Data Object sent with the Webhook Trigger
  const objectName = ctx.params.eventType;

  // Tip: Inspect the full body of the request to see associated Installs information
  const { actionType, salesforceUserId, salesforceInstanceUrl, updatedValue, oldValue } = ctx.req.body.data

  console.log(objectName, actionType, salesforceUserId, salesforceInstanceUrl, updatedValue, oldValue);
  
});

`;

module.exports = {
  name: 'Listen to Salesforce Webhook Events',
  description: `Listen to Salesforce Webhook Events using Fusebit's built-in event handler`,
  code,
};
