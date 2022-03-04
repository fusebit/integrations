router.post(
  '/api/tenant/:tenantId/webhook/-/resource/:resourceId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const asanaWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://developers.asana.com/docs/establish-a-webhook
      const webhook = await asanaWebhookClient.create(ctx.params.resourceId, {});
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

const code = `
/**
 * Create a new Webhook
 * 
 * @param resourceId {resourceId} Asana Resource ID
 */
${asanaCreateWebhook.toString()}
`;

module.exports = {
  name: 'Create Webhook',
  description: 'Create a new Webhook for use with this Integration',
  code,
};
