const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();
const router = integration.router;

const connectorName = 'test-pagerduty-connector';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const incidents = await sdk.get('/incidents');
  ctx.body = { success: incidents.ok };
});

router.delete('/api/webhook/:installId', async (ctx) => {
  const sdk = await integration.webhook.getSdk(ctx, connectorName, ctx.params.installId);
  await sdk.deleteAll();
});

router.get('/api/webhook/:installId', async (ctx) => {
  const sdk = await integration.webhook.getSdk(ctx, connectorName, ctx.params.installId);
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
    ],
    description: 'Sends PagerDuty v3 webhook events somewhere interesting.',
  });
});

router.get('/api/event/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const result = await sdk.post('/incidents', {
    data: {
      incident: {
        type: 'incident',
        title: `This server is on fire. ${Math.random() * 10000}`,
        service: {
          id: 'PBUCNVG',
          type: 'service_reference',
        },
        priority: {
          id: 'P53ZZH5',
          type: 'priority_reference',
        },
        urgency: 'high',
        body: {
          type: 'incident_body',
          details:
            'A disk is getting full on this machine. You should investigate what is causing the disk to fill, and ensure that there is an automated process in place for ensuring data is rotated (eg. logs should have logrotate around them). If data is expected to stay on this disk forever, you should start planning to scale up to a larger disk.',
        },
        escalation_policy: {
          id: 'P9925IU',
          type: 'escalation_policy_reference',
        },
      },
    },
  });
  ctx.status = 204;
});

integration.event.on('/:connectorId/webhook/:eventType', async (ctx) => {
  await integration.storage.setData(ctx, `/test/pagerDutyProvider/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
