async function createNewSubscriptionWithEncryption(ctx, organizationId, changeType, resource, expirationDateTime) {
  // Learn how to create a new subscription https://learn.microsoft.com/en-us/graph/webhooks-with-resource-data#creating-a-subscription
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // Fusebit will generate a clientState to ensure change Notifications are coming from Microsoft Graph Service.
  // Ensure you have configured properly the required key-pair (private and public keys) from your Azure Key Vault certificate.
  // We will add automatically the encryptionCertificate and encryptionCertificateId.
  const newSubscriptionWithEncryption = await client.create(organizationId, {
    changeType,
    resource,
    expirationDateTime,
    includeResourceData: true,
    useBeta: true,
  });

  return newSubscriptionWithEncryption;
}

const code = `
    /**
     * Create a new Microsoft Graph Webhook (Subscription) with encryption
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param organizationId {string} Your Directory (tenant) ID
     * @param changeType {string} Indicates the type of change(s) in the subscribed resource that will raise a change notification. (e.g created, updated, deleted)
     * @param resource {string} The available resource from Microsoft Graph to monitor (e.g Mail, Drives, Events, Contacts)
     * @param expirationDateTime {string} Specifies the date and time in UTC when the webhook subscription expires.
     * @returns {object} Newly created Subscription with encryption
     */
    ${createNewSubscriptionWithEncryption.toString()}
    `;

module.exports = {
  name: 'Create new Webhook (Subscription) with encryption',
  description: 'Create a new Microsoft Graph Webhook (Subscription) with encryption',
  code,
};
