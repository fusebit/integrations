// Fusebit GitLab Integration
//
// This simple GitLab integration allows you to call GitLab APIs on behalf of the tenants of your
// application. Fusebit manages the GitLab authorization process and maps tenants of your application
// to their GitLab credentials, so that you can focus on implementing the integration logic.
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

// The sample test endpoint of this integration gets all contacts stored in the GitLab account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a GitLab client pre-configured with credentials necessary to communicate with your tenant's GitLab account.
  // For the GitLab SDK documentation, see https://gitlab.com/.
  const gitlabClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const projects = await gitlabClient.Projects.all({ membership: true });
  const { name, username } = await gitlabClient.Users.current();
  ctx.body = `Hello ${name}, your GitLab username is ${username} and you belong to ${projects.length} projects`;
});

// Subscribe to Webhooks events (learn more at https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)
integration.event.on('/:componentName/webhook/:eventType', async (ctx) => {
  console.log('webhook received: ', ctx.req.body.data);
});

module.exports = integration;
