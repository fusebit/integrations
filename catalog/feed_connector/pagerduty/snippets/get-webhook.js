const code = `
/**
 * Get a specific Webhook
 * @param webhookId {string} The Webhook identifier
 */

 router.get(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const pagerdutyWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://support.pagerduty.com/docs/webhooks
      const webhookResponse = await pagerdutyWebhookClient.get(ctx.params.webhookId);
      ctx.body = webhookResponse;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'Get a specific Webhook',
  description: 'Get a specific PagerDuty Webhook',
  code,
};
