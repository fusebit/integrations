const code = `
/**
 * List all Services Webhooks
 */

 router.get(
  '/api/tenant/:tenantId/webhook',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const pagerdutyWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://support.pagerduty.com/docs/webhooks
      const webhooksResponse = await pagerdutyWebhookClient.list();
      ctx.body = webhooksResponse;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'List all Services Webhooks',
  description: ' List all PagerDuty Services Webhooks',
  code,
};
