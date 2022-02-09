// Fusebit Gitlab Integration
//
// This simple Gitlab integration allows you to call Gitlab APIs on behalf of the tenants of your
// application. Fusebit manages the Gitlab authorization process and maps tenants of your application
// to their Gitlab credentials, so that you can focus on implementing the integration logic.
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
const connectorName = 'gitlabConnector';

// The sample test endpoint of this integration performs the following in the Gitlab account associated with your tenant:
// - Gets all projects that the user belongs to
// - Get latest commit per project
// - Get current user information
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Gitlab client pre-configured with credentials necessary to communicate with your tenant's Gitlab account.
  // For the Gitlab SDK documentation, see https://gitlab.com/.
  const gitlabClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const projects = await gitlabClient.Projects.all({ membership: true });
  const commits = [];
  for await (const project of projects) {
    const lastCommit = await gitlabClient.Commits.all(project.id, {
      maxPages: 1,
    });
    commits.push({ project, lastCommit: lastCommit[0] });
  }

  const { name, username } = await gitlabClient.Users.current();
  const commitsMessage = commits.map((commit) => {
    return {
      project: commit.project.name,
      commit: {
        id: commit.lastCommit.id,
        author: commit.lastCommit.author_name,
        date: commit.lastCommit.created_at,
        title: commit.lastCommit.title,
      },
    };
  });

  ctx.body = `Hello ${name}, your GitLab username is ${username} and you belong to ${
    projects.length
  } projects. Latest commits: ${JSON.stringify(commitsMessage)}`;
});

// List commits for specific project
router.get(
  '/api/tenant/:tenantId/projects/:projectId/repository/commits',
  integration.middleware.authorizeUser('install:get'),
  async (ctx) => {
    // Create a Gitlab client pre-configured with credentials necessary to communicate with your tenant's Gitlab account.
    // For the Gitlab SDK documentation, see https://gitlab.com/.
    const gitlabClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
    const commits = await gitlabClient.Commits.all(ctx.params.projectId, {
      maxPages: 1,
    });
    ctx.body = commits;
  }
);

// List projects
router.get('/api/tenant/:tenantId/projects', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Gitlab client pre-configured with credentials necessary to communicate with your tenant's Gitlab account.
  // For the Gitlab SDK documentation, see https://gitlab.com/.
  const gitlabClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const projects = await gitlabClient.Projects.all({ membership: true });
  ctx.body = projects;
});

// Subscribe to Webhook events (learn more at https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  console.log('webhook received: ', ctx.req.body.data);
});

module.exports = integration;
