async function bambooHRUpdateWebhook(ctx, webhookId) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // This example updates the Employee data to monitor from the Webhook
  const updatedWebhook = await bambooHRWebhookClient.update(webhookId, {
    name: 'onEmployeeNamechange',
    monitorFields: ['firstName', 'lastName'],
    postFields: {
      firstName: 'First name',
      lastName: 'Last name',
    },
  });

  return updatedWebhook;
}

const code = `
  /**
   * Update a BambooHR webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param webhookId {string} The identifier of the webhook to update
   * @returns {object} Updated Webhook
   */
  ${bambooHRUpdateWebhook.toString()}
  `;

module.exports = {
  name: 'Update Webhook data',
  description: 'This snippet demonstrates how to update an existing BambooHR Webhook',
  code,
};
