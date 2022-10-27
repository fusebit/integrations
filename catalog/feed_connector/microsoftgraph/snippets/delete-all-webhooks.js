async function deleteAllWebhooks(ctx) {
  // Learn how to remove a Microsoft Graph Subscription https://learn.microsoft.com/en-us/graph/api/subscription-delete?view=graph-rest-1.0&tabs=http
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.deleteAll();
}

const code = `
    /**
     * Delete all existing Microsoft Graph Webhooks (Subscriptions)
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     */
    ${deleteAllWebhooks.toString()}
    `;

module.exports = {
  name: 'Delete all Microsoft Graph Webhooks (Subscriptions)',
  description: 'Delete all existing Microsoft Graph Webhooks (Subscriptions)',
  code,
};
