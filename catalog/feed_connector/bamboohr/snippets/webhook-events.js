const method = async (ctx) => {
  const {
    data: { employees, type, webhook },
  } = ctx.req.body;

  console.log(`Received an event of type ${type} for Webhook ${webhook.id}`);
  const client = await integration.service.getSdk(ctx, ctx.params.componentName, ctx.req.body.installIds[0]);

  for await (const { id, changedFields } of employees) {
    const employee = await client.get(`employees/${id}?fields=displayName,jobTitle`);
    console.log(
      `The employee ${employee.displayName} (${employee.jobTitle}) was updated with the fields ${changedFields.join(
        ','
      )}`
    );
  }
};
const code = `
/**
 * Use Fusebit's Event Handler to respond to BambooHR Webhook Events
 */
 integration.event.on(${method.toString()})
  `;

module.exports = {
  name: 'Respond to BambooHR Webhook Events',
  description: "Respond to BambooHR Webhook Events using Fusebit's built-in event handler",
  code,
};
