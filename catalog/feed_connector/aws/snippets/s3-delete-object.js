async function awsS3DeleteObject(ctx, bucketName, objectName) {
  const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

  // For the Aws SDK documentation, see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html.
  const awsCredentials = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const client = new S3Client({ credentials: awsCredentials });
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectName }));
}

const code = `
/**
 * Delete object from S3.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param bucketName {BucketName} Name of the bucket where you want to delete objects from within.
 * @param objectName {ObjectName} Name of the object that you want to delete.
 */
${awsS3DeleteObject.toString()}
`;

module.exports = {
  name: 'Delete Object Within S3',
  description: 'Delete a specific object within S3 when passed in bucket name and object name.',
  code,
};
