const { Integration } = require('@fusebit-int/framework');
const { S3 } = require('@aws-sdk/client-s3');
const integration = new Integration();

// Koa Router: https://koajs.com
const router = integration.router;
const connectorName = 'awsConnector';

// Test Endpoint: Get the buckets within the AWS account
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const awsCredentials = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
  const s3Client = new S3({ ...awsCredentials });
  const response = await s3Client.listBuckets({});

  ctx.body = { message: `${response.Buckets?.length} buckets discovered from the AWS account.` };
});

router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const awsCredentials = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const s3Client = new S3({ ...awsCredentials });

  const response = await s3Client.listBuckets({});

  const bucketList = await Promise.all(
    (response.Buckets || []).map(async (bucket) => {
      const bucketDetail = await s3Client.getBucketLocation({ Bucket: bucket.Name });
      return {
        bucketRegion: bucketDetail.LocationConstraint,
        bucketName: bucket.Name,
      };
    })
  );

  ctx.body = bucketList;
});

router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const awsCredentials = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const { bucketName, bucketRegion } = ctx.req.body;

  const s3Client = new S3({ ...awsCredentials, region: bucketRegion });

  await s3Client.createBucket({ Bucket: bucketName });
});

module.exports = integration;
