const method = async (ctx) => {
  // Learn how to register webhooks for Microsoft Dynamics https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/download-tools-nuget?view=op-9-1
  const client = await integration.service.getSdk(ctx, connectorName, ctx.req.body.installIds[0]);
  const caseId = ctx.req.body.data.ParentContext.PrimaryEntityId;
  const { title, ticketnumber } = await client.retrieve(caseId, 'incidents', ['title', 'ticketnumber']);
  ctx.body = `Case ${title} created with number ${ticketnumber}`;
};
const code = `
/**
 * Use Fusebit's Event Handler to respond to Microsoft Dynamics Webhook Events
 */
 integration.event.on(${method.toString()})
  `;

module.exports = {
  name: '(Customer Service) New Case Webhook',
  description: "Respond to Microsoft Dynamics Customer Service Webhook Events using Fusebit's built-in event handler",
  code,
};
