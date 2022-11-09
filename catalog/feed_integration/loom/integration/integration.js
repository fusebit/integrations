const { Integration } = require('@fusebit-int/framework');
const { readFileSync } = require('fs');
const { compile } = require('ejs');

const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'loomConnector';

// Test Endpoint: Get a jws used to load the recordSDK
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const loomClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  // The loomClient contains a jws generated automatically with the configured Loom private key.
  // it can be accessed via loomClient.fusebit.credentials.jws
  // API Reference: https://dev.loom.com/docs/record-sdk/details/key-pair-auth#using-your-private-key
  ctx.body = `A JWS was generated automatically, you can use it to render a Loom recordSDK, see an example implementation at ${loomClient.baseUrl}/api/tenant/${ctx.params.tenantId}/record`;
});

// Renders an HTML page with an authenticated Loom recordSDK
router.get('/api/tenant/:tenantId/record', async (ctx) => {
  const loomClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const file = readFileSync(`${__dirname}/template.ejs`).toString('utf-8');
  const template = compile(file, { openDelimiter: '{{', closeDelimiter: '}}' });
  ctx.body = template({ jws: loomClient.fusebit.credentials.jws });
});

module.exports = integration;
