// Fusebit Atlassian Confluence Integration
//
// This simple Atlassian integration allows you to call Atlassian APIs on behalf of the tenants of your
// application. Fusebit manages the Atlassian authorization process and maps tenants of your application
// to their Atlassian credentials, so that you can focus on implementing the integration logic.
//
// A Fusebit integration is a microservice running on the Fusebit platform.
// You control the endpoints exposed from the microservice. You call those endpoints from your application
// to perform specific tasks on behalf of the tenants of your app.
//
// Learn more about Fusebit integrations at: https://developer.fusebit.io/docs/integration-programming-model

const { Integration } = require('@fusebit-int/framework');

const integration = new Integration();

// Fusebit uses the KoaJS (https://koajs.com/) router to allow you to add custom HTTP endpoints
// to the integration, which you can then call from within your application.
const router = integration.router;

const connectorName = 'confluenceConnector';

// The sample test endpoint of this integration gets all available Atlassian resources for your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create an Atlassian client pre-configured with credentials necessary to communicate with your tenant's
  // Confluence account.
  //
  // For the Atlassian SDK documentation, see https://developer.atlassian.com/cloud/confluence/rest/intro/.
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const resources = await atlassianClient.getAccessibleResources();

  const confluence = atlassianClient.confluence(resources[0].id);

  const result = await confluence.get('/search');

  ctx.body = {
    message: `Found ${result.size} issues in Confluence Cloud ${resources[0].id}`,
  };
});

module.exports = integration;
