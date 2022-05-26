const code = `
/**
 * Delete a specific Webhook
 * @param webhookId {string} The Webhook identifier
 */

 router.delete(
  '/api/tenant/:tenantId/webhook/:webhookId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const pagerdutyWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://support.pagerduty.com/docs/webhooks
      const deletedWebhookResponse = await pagerdutyWebhookClient.delete(ctx.params.webhookId);
      ctx.body = deletedWebhookResponse;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'Delete a specific Webhook',
  description: 'Delete a specific PagerDuty Webhook',
  code,
};
