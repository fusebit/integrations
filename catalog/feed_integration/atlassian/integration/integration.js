// Fusebit Atlassian Jira Integration
//
// This simple Atlassian integration allows you to call Atlassian APIs on behalf of the tenants of your
// application. Fusebit manages the Atlassian authorization process and maps tenants of your application
// to their Atlassian credentials, so that you can focus on implementing the integration logic.
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

const connectorName = 'atlassianConnector';

// The sample test endpoint of this integration gets all available Atlassian resources for your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create a Atlassian client pre-configured with credentials necessary to communicate with your tenant's Atlassian account.
  // For the Atlassian SDK documentation, see https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/.
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const resources = await atlassianClient.getAccessibleResources();

  ctx.body = {
    message: `Successfully loaded ${resources.length} resources from Atlassian`,
  };
});

module.exports = integration;
