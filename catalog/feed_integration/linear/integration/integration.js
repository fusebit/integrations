const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'linearConnector';

// Test Endpoint: Get all contacts stored in the Linear account associated with your tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const linearClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/linear/linear
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  if (!myIssues.nodes.length) {
    ctx.body = {
      message: 'You have no issues!',
    };
    return;
  } else {
    ctx.body = {
      message: 'Success! You have issues:',
    };
    myIssues.nodes.map((issue) => {
      ctx.body.message += `\n > ${issue.title}`;
    });
    return;
  }
});

// Sample App Endpoint: Retrieve Issue Title and Issue Description from Linear
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const linearClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const issues = await linearClient.issues();

  const issuesList = issues.nodes.map((issue) => ({
    issueTitle: issue.title,
    issueDescription: issue.description,
  }));

  ctx.body = issuesList;
});

module.exports = integration;
