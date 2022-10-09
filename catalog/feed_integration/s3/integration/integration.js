const { Integration } = require('@fusebit-int/framework');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const integration = new Integration();

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'awsConnector';

// Test Endpoint: Get the buckets within the AWS account
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const awsCredentials = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
  const client = new S3Client({ credentials: awsCredentials });
  const command = new ListBucketsCommand({});
  const response = await client.send(command);

  ctx.body = { message: `${response.Buckets.length} buckets discovered from the AWS account.` };
});

module.exports = integration;
