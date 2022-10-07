async function updateWebhookSecret(ctx, organizationId) {
  // Learn how to register webhooks for Microsoft Dynamics https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/download-tools-nuget?view=op-9-1
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.update(organizationId);
}

const code = `
    /**
     * Update an existing Webhook secret from a Microsoft Dynamics Organization
     * If you need to offer a mechanism to refresh the Webhook secret for a specific
     * Microsoft Dynamics instance, use this method.
     * This method is helpful for situations where your users forget the secret configured
     * using the plug-in registration tool for their Microsoft Dynamics instance.
     * Warning: Updating the Webhook secret will break your existing webhooks, you need to update
     * the secret using the plug-in registration tool. 
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param organizationId {string} The Id of the organization
     */
    ${updateWebhookSecret.toString()}
    `;

module.exports = {
  name: 'Update webhook secret',
  description: 'Update an existing Webhook secret from a Microsoft Dynamics Organization ',
  code,
};