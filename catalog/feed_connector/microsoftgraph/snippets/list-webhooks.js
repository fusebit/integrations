async function listWebhooks(ctx) {
  // Learn how Microsoft Graph Subscription list works https://learn.microsoft.com/en-us/graph/api/subscription-list?view=graph-rest-1.0&tabs=http
  const webhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await webhookClient.list();
}

const code = `
    /**
     * List all existing Microsoft Graph Webhooks (Subscriptions)
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     */
    ${listWebhooks.toString()}
    `;

module.exports = {
  name: 'List all Microsoft Graph Webhooks (Subscriptions)',
  description: 'List all existing Microsoft Graph Webhooks (Subscriptions)',
  code,
};
