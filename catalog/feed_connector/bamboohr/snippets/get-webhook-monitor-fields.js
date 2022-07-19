async function bambooHRGetWebhookMonitorFields(ctx) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhook = await bambooHRWebhookClient.getMonitorFields();

  return webhook;
}

const code = `
  /**
   * Get a BambooHR Webhook monitor fields
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @returns {object} A list of monitor fields
   */
  ${bambooHRGetWebhookMonitorFields.toString()}
  `;

module.exports = {
  name: 'Get Webhook monitor fields',
  description: 'Get a list of fields webhooks can monitor',
  code,
};
