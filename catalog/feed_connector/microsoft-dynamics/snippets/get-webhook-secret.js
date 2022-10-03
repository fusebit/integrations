async function getWebhookSecret(ctx, organizationId) {
  // Learn how to register webhooks for Microsoft Dynamics https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/download-tools-nuget?view=op-9-1
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.get(organizationId);
}

const code = `
    /**
     * Retrieve an existing Webhook secret from a Microsoft Dynamics Organization 
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param organizationId {string} The Id of the organization
     */
    ${getWebhookSecret.toString()}
    `;

module.exports = {
  name: 'Get webhook secret',
  description: 'Retrieve an existing Webhook secret from a Microsoft Dynamics Organization ',
  code,
};
