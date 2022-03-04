router.get(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://developers.asana.com/docs/get-a-webhook
      const webhook = await asanaWebhookClient.get(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

const code = `
/**
 * Get a Webhook by ID
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */

 router.get(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://developers.asana.com/docs/get-a-webhook
      const webhook = await asanaWebhookClient.get(ctx.params.webhookId);
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);
`;

module.exports = {
  name: 'Get Webhook',
  description: 'Get a Webhook by ID',
  code,
};
