async function listWebhookSteps(ctx) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return webhookClient.list();
}

const code = `
/**
 * Retrieve the Webhook Steps registered by Fusebit from a Microsoft Dynamics Organization
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 */
${listWebhookSteps.toString()}
    `;

module.exports = {
  name: 'List Webhook Steps',
  description: 'Retrieve the Webhook Steps registered by Fusebit from a Microsoft Dynamics Organization',
  code,
};
