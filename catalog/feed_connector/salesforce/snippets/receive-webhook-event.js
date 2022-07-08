const code = `
/**
 * Use Fusebit's Event Handler to respond to Salesforce Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Listen to Salesforce Webhook events
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => { 

  // Data Object sent with the Webhook Trigger
  const objectName = ctx.params.eventType;
  const actionType = ctx.req.body.data.action;
  const salesforceUserId = ctx.req.body.data.userId;
  const salesforceInstanceUrl = ctx.req.body.data.instanceUrl;
  const updatedValue = ctx.req.body.data.new;
  const oldValue = ctx.req.body.data.old;

  console.log(objectName, actionType, salesforceUserId, salesforceInstanceUrl, updatedValue, oldValue);
  
});

`;

module.exports = {
  name: 'Listen to Salesforce Webhook Events',
  description: "Listen to Salesforce Webhook Events using Fusebit's built-in event handler",
  code,
};
