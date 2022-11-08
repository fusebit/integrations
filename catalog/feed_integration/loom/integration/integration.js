const { Integration } = require('@fusebit-int/framework');
const { readFileSync } = require('fs');
const { compile } = require('ejs');

const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'loomConnector';

// Test Endpoint: Get all contacts stored in the Loom account associated with your tenant.
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const loomClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://dev.loom.com/docs/record-sdk/details/key-pair-auth#using-your-private-key
  ctx.body = `A JWS was generated automatically: ${client.fusebit.credentials.jws}, you can use it to render a Loom customSDK, open it <a href="${client.baseUrl}/api/tenant/${ctx.params.tenantId}/record">here</a>`;
});

router.get('/api/tenant/:tenantId/record', async (ctx) => {
  const client = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const file = readFileSync(`${__dirname}/template.ejs`).toString('utf-8');
  const template = compile(file, { openDelimiter: '{{', closeDelimiter: '}}' });
  ctx.body = template({ jws: client.fusebit.credentials.jws });
});

module.exports = integration;
