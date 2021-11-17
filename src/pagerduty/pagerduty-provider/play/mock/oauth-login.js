const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();
const router = integration.router;

const connectorName = 'test-pagerduty-connector';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const incidents = await sdk.get('/incidents');
  ctx.body = { success: incidents.ok };
});

router.post('/api/webhook/:installId', async (ctx) => {
  const sdk = await integration.webhook.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  await sdk.create({
    filter: {
      type: 'account_reference',
    },
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
      'incident.status_update_published',
      'incident.triggered',
      'incident.unacknowledged',
      'incident.opened',
    ],
    description: 'Sends PagerDuty v3 webhook events somewhere interesting.',
  });
});

integration.event.on('/:connectorId/webhook/:eventType', async (ctx) => {
  await integration.storage.setData(ctx, `/test/pagerDutyProvider/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
