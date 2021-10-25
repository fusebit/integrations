const { Integration } = require('@fusebit-int/framework');

const superagent = require('superagent');

const integration = new Integration();
const router = integration.router;

router.get('/api/do/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  ctx.body = await sdk.getAccessibleResources();
});

router.get('/api/unregister/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  const response = await sdk.webhook.unregisterAll();
  ctx.body = response;
});

router.get('/api/register/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  const resources = await sdk.getAccessibleResources();
  const registerResponse = await sdk.webhook.register(resources[0].id, [
    {
      jqlFilter: 'status != done',
      events: ['jira:issue_created', 'jira:issue_updated'],
    },
  ]);

  ctx.body = registerResponse;
});

router.get('/api/event/:installId', async (ctx) => {
  const sdk = await integration.service.getSdk(ctx, 'atlassian-test-connector', ctx.params.installId);
  const resources = await sdk.getAccessibleResources();

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
  console.log(`Event from Jira: ${JSON.stringify(ctx.params)}`);
  console.log(`${JSON.stringify(ctx.req.body, null, 2)}`);
  await integration.storage.setData(ctx, `/test/atlassianProvider/webhook/${Math.random() * 10000000}`, {
    data: ctx.req.body,
    expires: new Date(Date.now() + 60 * 1000).toISOString(),
  });
});

module.exports = integration;
