async function deleteWebhookSecret(ctx, organizationId) {
  // Learn how to register webhooks for Microsoft Dynamics https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/download-tools-nuget?view=op-9-1
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.delete(organizationId);
}

const code = `
    /**
     * Delete an existing Webhook secret from a Microsoft Dynamics Organization 
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param organizationId {string} The Id of the organization
     */
    ${deleteWebhookSecret.toString()}
    `;

module.exports = {
  name: 'Delete webhook secret',
  description: 'Delete an existing Webhook secret from a Microsoft Dynamics Organization ',
  code,
};
