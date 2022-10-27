async function deleteWebhook(ctx, subscriptionId) {
  // Learn how to remove a Microsoft Graph Subscription https://learn.microsoft.com/en-us/graph/api/subscription-delete?view=graph-rest-1.0&tabs=http
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.delete(subscriptionId);
}

const code = `
    /**
     * Delete an existing Microsoft Graph Webhook (Subscription)
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param subscriptionId {string} The Id of the Subscription to delete
     */
    ${deleteWebhook.toString()}
    `;

module.exports = {
  name: 'Delete Microsoft Graph Webhook (Subscription)',
  description: 'Delete an existing Microsoft Graph Webhook (Subscription)',
  code,
};
