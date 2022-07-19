const code = `
/**
 * Use Fusebit's Event Handler to respond to BambooHR Webhook Events
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 // Subscribe to Webhook events (learn more at https://documentation.bamboohr.com/reference/webhooks-1)
 integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  const {
    data: { employees, type}
  } = ctx.req.body;
  
  console.log('Received a webhook event', type);
  const client = await integration.service.getSdk(
    ctx,
    ctx.params.componentName,
    ctx.req.body.installIds[0]
  );


  for await (const { id, changedFields } of employees) {
    const employee = await client.get(\`employees/\${id}?fields=displayName,jobTitle\`);
    console.log(\`The employee \${employee.displayName} (\${employee.jobTitle}) was updated with the fields \${changedFields.join(',')}\`);
  }
 });

`;

module.exports = {
  name: 'Respond to BambooHR Webhook Events',
  description: "Respond to BambooHR Webhook Events using Fusebit's built-in event handler",
  code,
};
