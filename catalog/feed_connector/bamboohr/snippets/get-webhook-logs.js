async function bambooHRGetWebhookLogs(ctx, id) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhook = await bambooHRWebhookClient.getLogs(id);

  return webhook;
}

const code = `
  /**
   * Get a BambooHR Webhook Logs
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param id {string} The identifier of the webhook to get
   * @returns {object} BambooHR Webhook Logs
   */
  ${bambooHRGetWebhookLogs.toString()}
  `;

module.exports = {
  name: 'Get Webhook logs',
  description: 'Get BambooHR Webhook logs by Webhook id',
  code,
};
