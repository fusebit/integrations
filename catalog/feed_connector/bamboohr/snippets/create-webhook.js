async function bambooHRCreateWebhook(ctx) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHrWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const createdWebhook = await bambooHrWebhookClient.create({
    name: 'onEmployeeChange',
    monitorFields: ['employeeNumber', 'firstName', 'lastName'],
    postFields: {
      employeeNumber: 'Employee #',
      firstName: 'First name',
      lastName: 'Last name',
    },
  });

  return createdWebhook;
}

const code = `
  /**
   * Create a new BambooHR Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @returns {object} Newly created webhook.
   */
  ${bambooHRCreateWebhook.toString()}
  `;

module.exports = {
  name: 'Create new Webhook',
  description: 'Create a new BambooHR Webhook that listens to changes in Employee fields',
  code,
};
