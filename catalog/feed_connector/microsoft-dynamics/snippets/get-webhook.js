async function getWebhook(ctx) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return webhookClient.getWebhook();
}

const code = `
/**
 * Retrieve the Webhook automatically registered by Fusebit from a Microsoft Dynamics Organization
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 */
${getWebhook.toString()}
    `;

module.exports = {
  name: 'Get Webhook',
  description: 'Retrieve the Webhook automatically registered by Fusebit from a Microsoft Dynamics Organization',
  code,
};
