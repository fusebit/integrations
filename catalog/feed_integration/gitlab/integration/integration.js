const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'gitlabConnector';

// Test Endpoint: Get latest commits per project for account associated with your tenant:
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const gitlabClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/jdalrymple/gitbeaker
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

  ctx.body = `Success! ${name}, your GitLab username is ${username} and you belong to ${
    projects.length
  } projects. Latest commits: ${JSON.stringify(commitsMessage)}`;
});

module.exports = integration;
