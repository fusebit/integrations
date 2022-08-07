async function bambooHRListWebhooks(ctx) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhooks = await bambooHRWebhookClient.list();

  return webhooks;
}

const code = `
  /**
   * List all BambooHR webhooks
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @returns {Array} BambooHR Webhooks list 
   */
  ${bambooHRListWebhooks.toString()}
  `;

module.exports = {
  name: 'List All Webhooks',
  description: 'List BambooHR Webhooks',
  code,
};
