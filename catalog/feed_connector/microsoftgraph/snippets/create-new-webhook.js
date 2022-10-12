async function createNewSubscription(ctx, organizationId, changeType, resource, expirationDateTime) {
  // Learn how to create a new subscription https://learn.microsoft.com/en-us/graph/api/subscription-post-subscriptions?view=graph-rest-1.0&tabs=http
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // Fusebit will generate a clientState to ensure change Notifications are coming from Microsoft Graph Service.
  const newSubscription = await client.create(organizationId, {
    changeType,
    resource,
    expirationDateTime,
  });

  return newSubscription;
}

const code = `
    /**
     * Create a new Microsoft Graph Webhook (Subscription)
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param organizationId {string} Your Directory (tenant) ID
     * @param changeType {string} Indicates the type of change(s) in the subscribed resource that will raise a change notification. (e.g created, updated, deleted)
     * @param resource {string} The available resource from Microsoft Graph to monitor (e.g Mail, Drives, Events, Contacts)
     * @param expirationDateTime {string} Specifies the date and time in UTC when the webhook subscription expires.
     * @returns {object} Newly created Subscription
     */
    ${createNewSubscription.toString()}
    `;

module.exports = {
  name: 'Create new Webhook (Subscription)',
  description: 'Create a new Microsoft Graph Webhook (Subscription)',
  code,
};
