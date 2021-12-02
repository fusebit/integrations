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

const connectorName = 'atlassianConnector';

// The sample test endpoint of this integration gets all available Atlassian resources for your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // Create an Atlassian client pre-configured with credentials necessary to communicate with your tenant's
  // Confluence account.
  //
  // For the Atlassian SDK documentation, see https://developer.atlassian.com/cloud/confluence/rest/intro/.
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const resources = await atlassianClient.getAccessibleResources();

  const confluenceCloud = resources.find((resource) => resource.scopes.includes('search:confluence'));
  const confluence = atlassianClient.confluence(confluenceCloud.id);

  const result = await confluence.get('/space');

  ctx.body = {
    message: `Found ${result.size} spaces in Confluence Cloud ${confluenceCloud.id}`,
  };
});

// Retrieve pages and their URLs for Confluence
// Note: This endpoint is also used by the sample app
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const resources = await atlassianClient.getAccessibleResources();
  const confluenceCloud = resources.find((resource) => resource.scopes.includes('search:confluence'));
  const confluence = atlassianClient.confluence(confluenceCloud.id);

  const confluencePages = await confluence.get('/content');
  const baseURL = confluencePages._links.base;

  const pageList = Array.from(confluencePages.results).map((results) => ({
    pageTitle: results.title,
    pageLink: baseURL + results._links.webui,
  }));

  ctx.body = pageList;
});

module.exports = integration;
