const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'atlassianConnector';

/// Test Endpoint: Get all available Atlassian resources for your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developer.atlassian.com/cloud/confluence/rest/intro/.
  const resources = await atlassianClient.getAccessibleResources('confluence');
  if (resources.length === 0) {
    ctx.throw(404, 'No Matching Account found in Atlassian');
  }

  const confluenceCloud = resources[0];
  const confluence = atlassianClient.confluence(confluenceCloud.id);

  const result = await confluence.get('/space');

  ctx.body = {
    message: `Found ${result.size} spaces in Confluence Cloud ${confluenceCloud.id}`,
  };
});

// Sample App Endpoint: Retrieve pages and their URLs from Confluence
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const resources = await atlassianClient.getAccessibleResources('confluence');
  if (resources.length === 0) {
    ctx.throw(404, 'No Matching Account found in Atlassian');
  }

  const confluenceCloud = resources[0];
  const confluence = atlassianClient.confluence(confluenceCloud.id);

  const confluencePages = await confluence.get('/content');
  const baseURL = confluencePages._links.base;

  const pageList = confluencePages.results.map((results) => ({
    pageTitle: results.title,
    pageLink: baseURL + results._links.webui,
  }));

  ctx.body = pageList;
});

module.exports = integration;
