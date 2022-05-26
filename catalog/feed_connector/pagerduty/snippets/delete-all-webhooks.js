const code = `
/**
 * Delete all Webhooks
 */

 router.delete(
  '/api/tenant/:tenantId/webhook',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const pagerdutyWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://support.pagerduty.com/docs/webhooks
      const deleteAllResponse = await pagerdutyWebhookClient.deleteAll();
      ctx.body = deleteAllResponse;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'Delete All Webhooks',
  description: 'Delete all PagerDuty Webhooks',
  code,
};
