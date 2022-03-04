router.delete(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://developers.asana.com/docs/delete-a-webhook
      const webhook = await asanaWebhookClient.delete(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

const code = `
/**
 * Delete a webhook by ID
 * 
 * @param webhookId {webhookId} Webhook ID
 */

 router.delete(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://developers.asana.com/docs/delete-a-webhook
      const webhook = await asanaWebhookClient.delete(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'Delete Webhook',
  description: 'Delete a webhook by ID',
  code,
};
