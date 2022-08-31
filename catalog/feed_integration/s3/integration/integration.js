const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'awsConnector';

// Test Endpoint: Get Reddit karma held by the tenant
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const awsClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const s3Sdk = awsClient.get(AWS.S3, 'us-east-1');
  const buckets = await s3Sdk.listBuckets().promise();

  ctx.body = { message: `${buckets.Buckets.length} buckets discovered from the AWS account.` };
});

module.exports = integration;
