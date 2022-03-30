const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Returns a count of how many files & folders are in your tenant's Google Drive
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://developers.google.com/drive/api/v3/reference
  const files = await googleClient
    .drive({
      version: 'v3',
    })
    .files.list();

  ctx.body = {
    message: `Success! Your drive contains ${files.data.files.length} files and folders.`,
  };
});

module.exports = integration;
