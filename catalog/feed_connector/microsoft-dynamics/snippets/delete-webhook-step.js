async function deleteWebhookStep(ctx, webhookStepId) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.delete(webhookStepId);
}

const code = `
    /**
     * Delete a Webhook step from a Microsoft Dynamics Organization
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param webhookStepId {String} Unique identifier of the Webhook step
     */
    ${deleteWebhookStep.toString()}
    `;

module.exports = {
  name: 'Delete Webhook step',
  description: 'Delete a Webhook step from a Microsoft Dynamics Organization',
  code,
};
