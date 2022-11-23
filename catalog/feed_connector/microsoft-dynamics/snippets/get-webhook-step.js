async function getWebhookStep(ctx, webhookStepId) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return webhookClient.get(webhookStepId);
}

const code = `
/**
 * Retrieve the Webhook Step from a Microsoft Dynamics Organization
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param webhookStepId {String} The Webhook Step unique identifier
 */
${getWebhookStep.toString()}
    `;

module.exports = {
  name: 'Get Webhook Step',
  description: 'Retrieve the Webhook Step from a Microsoft Dynamics Organization',
  code,
};
