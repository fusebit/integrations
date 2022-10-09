async function awsS3CreateObject(ctx, bucketName, objectName, objectContent) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  // For the Aws SDK documentation, see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html.
  const awsCredentials = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const client = new S3Client({ credentials: awsCredentials });
  await client.send(new PutObjectCommand({ Bucket: bucketName, Key: objectName, Body: Buffer.from(objectContent) }));
}

const code = `
/**
 * Create an object within S3.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param bucketName {BucketName} The name of the bucket where you want to create an object within.
 * @param objectname {ObjectName} The name of the object you want to create.
 * @param objectContent {ObjectContent} The content of the object you want to create.
 */
${awsS3CreateObject.toString()}
`;

module.exports = {
  name: 'Create Object Within S3',
  description:
    'Create an specific object with cotent within s3 when passed in bucketName, objectName, and objectContent.',
  code,
};
