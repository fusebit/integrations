const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'mailchimpConnector';

// Test Endpoint: Get all Contacts Stored in the Mailchimp Account associated with your Tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const mailchimpClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://github.com/mailchimp/mailchimp-marketing-node
  const { lists } = await mailchimpClient.marketing.lists.getAllLists();

  ctx.body = lists.map((audience) => ({
    audienceName: audience.name,
    activeMembers: audience.stats.member_count,
  }));
});

module.exports = integration;
