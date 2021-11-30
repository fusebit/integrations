const { Integration } = require('@fusebit-int/framework');

const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

const connectorName = '##CONNECTOR_NAME##';

router.get('/api/check/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  ctx.body = await sdk.getAccessibleResources('jira');
});

router.get('/api/unregister/:installId', async (ctx) => {
  const webhookSdk = await integration.webhook.getSdk(ctx, connectorName, ctx.params.installId);
  const response = await webhookSdk.deleteAll();
  ctx.body = response;
});

router.get('/api/register/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const webhookSdk = await integration.webhook.getSdk(ctx, connectorName, ctx.params.installId);
  const resources = await sdk.getAccessibleResources('jira');
  const registerResponse = await webhookSdk.create(resources[0].id, [
    {
      jqlFilter: 'status != done',
      events: ['jira:issue_created', 'jira:issue_updated'],
    },
  ]);

  ctx.body = registerResponse;
});

router.get('/api/list/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const webhookSdk = await integration.webhook.getSdk(ctx, connectorName, ctx.params.installId);
  const resources = await sdk.getAccessibleResources('jira');
  const webhooks = await webhookSdk.list(resources[0].id);
  ctx.body = { webhooks };
});

router.get('/api/event/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, connectorName, ctx.params.installId);
  const resources = await sdk.getAccessibleResources('jira');

  const rand = `${Math.random() * 10000}`;
  const response = await superagent
    .put(`https://api.atlassian.com/ex/jira/${resources[0].id}/rest/api/3/issue/DEMO-1`)
    .set('Authorization', `Bearer ${sdk.fusebit.credentials.access_token}`)
    .set('Content-type', 'application/json')
    .send({
      update: {
        summary: [
          {
            set: `The issue is ${rand}`,
          },
        ],
      },
    });

  ctx.status = response.statusCode;
  ctx.body = response.body;
});

integration.event.on('/:connectorId/webhook/:eventType', async (ctx) => {
  await integration.storage.setData(ctx, `/test/atlassianProvider/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
