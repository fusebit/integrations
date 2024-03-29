async function bambooHRGetWebhook(ctx, id) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhook = await bambooHRWebhookClient.get(id);

  return webhook;
}

const code = `
  /**
   * Get a BambooHR Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param id {string} The identifier of the webhook to get
   * @returns {object} BambooHR Webhook
   */
  ${bambooHRGetWebhook.toString()}
  `;

module.exports = {
  name: 'Get Webhook',
  description: 'Get BambooHR Webhook by Webhook id',
  code,
};
