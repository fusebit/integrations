async function awsS3ListObjects(ctx, bucketName) {
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

  // For the Aws SDK documentation, see {enter-url-here}.
  const awsCredentials = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const client = new S3Client({ credentials: awsCredentials });
  return await client.send(new ListObjectsV2Command({ Bucket: bucketName })).Contents;
}

const code = `
/**
 * List objects within the s3 bucket.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param bucketName {BucketName} The name of the s3 bucket you want to list files from.
 */
${awsS3ListObjects.toString()}
`;

module.exports = {
  name: 'List Objects Within S3',
  description: 'List objects when given a s3 bucket name.',
  code,
};
