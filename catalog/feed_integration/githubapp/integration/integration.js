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
// to the integration, which you can then call from within your application.
const router = integration.router;

const connectorName = 'githubappConnector';

// The sample test endpoint of this integration gets the user account details in the GitHub account associated with your tenant.
router.post('/api/tenant/:tenantId/test', async (ctx) => {
  const githubapp = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  // Use the authorizing user credentials
  const userClient = githubapp.user();
  const { data } = await userClient.rest.users.getAuthenticated();
  ctx.body = data;
});

// List repository issues
router.get('/api/tenant/:tenantId/:org/:repo/issues', async (ctx) => {
  const githubapp = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const userClient = githubapp.user();
  const iterator = userClient.paginate.iterator(githubapp.rest.issues.listForRepo, {
    owner: ctx.params.org,
    repo: ctx.params.repo,
    per_page: 100,
  });

  // iterate through each response
  const issuesList = [];
  for await (const { data: issues } of iterator) {
    for (const issue of issues) {
      issuesList.push(issue);
    }
  }
  ctx.body = issuesList;
});

// Create a new GitHub issue
router.post('/api/tenant/:tenantId/:owner/:repo/issue', async (ctx) => {
  const githubapp = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const userClient = githubapp.user();
  const { data } = await userClient.rest.issues.create({
    owner: ctx.params.owner,
    repo: ctx.params.repo,
    title: 'Hello world from Fusebit',
  });
  ctx.body = data;
});

// Create a new GitHub issue authenticated as a GitHub App Installation
router.post('/api/tenant/:tenantId/:owner/:repo/issue', async (ctx) => {
  const githubapp = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  // Ensure you have configured your GitHub Connector properly in order to Authenticate as a GitHub Application.
  // see our developer docs for more information https://developer.fusebit.io/docs/githubapp
  const appClient = await githubapp.app();
  // You use the GitHub App client to list your GitHub App installations
  const installations = await appClient.rest.apps.listInstallations();

  if (installations.length) {
    // Now you have your installation, you can request an access token to the specific installation
    // We perform all that work for you and you get back an authenticated SDK as a GitHub installation.
    const installationClient = await appClient.installation(installations[0].id);

    const { data } = await installationClient.rest.issues.create({
      owner: ctx.params.owner,
      repo: ctx.params.repo,
      title: 'Hello world from Fusebit',
    });
    ctx.body = data;
  }
});

// Subscribe to events
integration.event.on('/:componentName/webhook/issue_comment.created', async (ctx) => {
  const {
    data: { comment },
  } = ctx.req.body.data;
  console.log('comment', comment);
});

integration.event.on('/:componentName/webhook/issues.reopened', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('issues.reopened', data);
});

integration.event.on('/:componentName/webhook/issues.closed', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('issues.closed', data);
});

// Listen all issues related webhooks
integration.event.on('/:componentName/webhook/(issues.*)', async (ctx) => {
  const { data } = ctx.req.body.data;
  console.log('captured webhook', data);
});

module.exports = integration;
