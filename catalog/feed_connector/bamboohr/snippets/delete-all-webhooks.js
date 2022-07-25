async function bambooHRDeleteAllWebhooks(ctx) {
  // For BambooHR Webhooks documentation, see https://documentation.bamboohr.com/reference/webhooks-1
  const bambooHRWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await bambooHRWebhookClient.deleteAll();
}

const code = `
  /**
   * Delete all BambooHR Webhooks
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   */
  ${bambooHRDeleteAllWebhooks.toString()}
  `;

module.exports = {
  name: 'Delete all Webhooks',
  description: 'Delete all BambooHR Webhooks',
  code,
};
