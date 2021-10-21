// Fusebit GitHub Integration
//
// This simple GitHub integration allows you to call GitHub APIs on behalf of the tenants of your
// application. Fusebit manages the GitHub authorization process and maps tenants of your application
// to their GitHub credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit Integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from witin your application.
const router = integration.router;

// The sample test endpoint of this integration gets the user account details in the GitHub account associated with your tenant.
router.post('/api/tenant/:tenantId/test', async (ctx) => {
  const github = await integration.tenant.getSdkByTenant(ctx, 'github', ctx.params.tenantId);
  const { data } = await github.rest.users.getAuthenticated();
  ctx.body = data;
});

// You can use GitHub standard RESTful API from the SDK (read more at https://docs.github.com/en/rest)
router.get('/api/tenant/:tenantId/:org/repos', async (ctx) => {
  const github = await integration.tenant.getSdkByTenant(ctx, 'github', ctx.params.tenantId);
  ctx.body = await github.request(`GET /orgs/${ctx.params.org}/repos`);
});

// Create a new GitHub issue
router.post('/api/tenant/:tenantId/:owner/:repo/issue', async (ctx) => {
  const github = await integration.tenant.getSdkByTenant(ctx, 'github', ctx.params.tenantId);
  const { data } = await github.rest.issues.create({
    owner: ctx.params.owner,
    repo: ctx.params.repo,
    title: 'Hello world from Fusebit',
  });
  ctx.body = data;
});

/* Subscribe to events
Read more about Webhooks here https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads
*/
integration.event.on('/github/webhook/issue_comment.created', async (ctx) => {
  const {
    data: { comment },
  } = ctx.req.body.data;
  console.log('comment', comment);
});

integration.event.on('/github/webhook/issues.reopened', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('issues.reopened', data);
});

integration.event.on('/github/webhook/issues.closed', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('issues.closed', data);
});

// Listen all issues related webhooks
integration.event.on('/github/webhook/(issues.*)', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('captured webhook', data);
});

module.exports = integration;
