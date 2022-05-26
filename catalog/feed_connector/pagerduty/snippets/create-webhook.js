const code = `
/**
 * Create a new Webhook
 * @param tenantId {string} Tenant Id
 * @param serviceId {string} The identifier of the service
 */

 router.post(
  '/api/tenant/:tenantId/webhook/:serviceId',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    try {
      const pagerdutyWebhookClient = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

      // API Reference: https://support.pagerduty.com/docs/webhooks
      const webhook = await pagerdutyWebhookClient.create({
        description: 'Test Webhook',
        events: [
            'incident.acknowledged',
            'incident.annotated',
            'incident.delegated',
            'incident.escalated',
            'incident.priority_updated',
            'incident.reassigned',
            'incident.reopened',
            'incident.resolved',
            'incident.responder.added',
            'incident.responder.replied',
            'incident.triggered',
            'incident.unacknowledged'
        ],
        filter: {
            id: ctx.params.serviceId,
            type: 'service_reference'
        }
    })
      ctx.body = webhook;
    } catch (e) {
      ctx.throw(e);
    }
  }
);

`;

module.exports = {
  name: 'Create Webhook',
  description: 'Create a new Webhook for use with this Integration',
  code,
};
