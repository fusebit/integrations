async function deleteAllWebhookSteps(ctx) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.deleteAll();
}

const code = `
    /**
     * Delete all the Webhook Steps registered by Fusebit from a Microsoft Dynamics Organization
     * Steps not registered automatically by Fusebit will not be deleted.
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     */
    ${deleteAllWebhookSteps.toString()}
    `;

module.exports = {
  name: 'Delete All Webhook Steps',
  description: 'Delete all the Webhook Steps registered by Fusebit from a Microsoft Dynamics Organization',
  code,
};
