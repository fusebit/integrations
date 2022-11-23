async function deleteWebhook(ctx) {
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.deleteWebhook();
}

const code = `
    /**
     * Delete an existing Fusebit's Webhook from a Microsoft Dynamics Organization
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     */
    ${deleteWebhook.toString()}
    `;

module.exports = {
  name: 'Delete Fusebit registered Webhook',
  description:
    "Delete an existing Fusebit's Webhook from a Microsoft Dynamics Organization. Warning!: deleting the Webhook will unregister all the Webhook Steps registered to the underlying Microsoft Dynamics Organization",
  code,
};
