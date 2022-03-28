const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'atlassianConnector';

// Test Endpoint: Get all available Atlassian resources for your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/
  const resources = await atlassianClient.getAccessibleResources('jira');
  if (resources.length === 0) {
    ctx.throw(404, 'No Matching Account found in Atlassian');
  }
  const jiraCloud = resources[0];
  const jira = atlassianClient.jira(jiraCloud.id);

  const result = await jira.get('/search');

  ctx.body = {
    message: `Success! Found ${result.total} issues in Jira Cloud ${resources[0].id}`,
  };
});

// Sample App Endpoint: Retrieve Issue IDs and Summaries from Jira
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const atlassianClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const resources = await atlassianClient.getAccessibleResources('jira');
  if (resources.length === 0) {
    ctx.throw(404, 'No Matching Account found in Atlassian');
  }
  const jiraCloud = resources[0];
  const jira = atlassianClient.jira(jiraCloud.id);

  const jiraIssues = await jira.get('/search?maxResults=15');

  const issuesList = jiraIssues.issues.map((issues) => ({
    issueKey: issues.key,
    issueSummary: issues.fields.summary,
  }));

  ctx.body = issuesList;
});

module.exports = integration;
