async function bambooHRDeleteWebhook(ctx, webhookId) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const deletedWebhook = await bambooHRWebhookClient.delete(webhookId);

  return deletedWebhook;
}

const code = `
  /**
   * Delete a BambooHR Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param webhookId {string} The identifier of the webhook to remove
   * @returns {object} Deleted webhook response.
   */
  ${bambooHRDeleteWebhook.toString()}
  `;

module.exports = {
  name: 'Delete Webhook',
  description: 'Delete a BambooHR Webhook',
  code,
};
