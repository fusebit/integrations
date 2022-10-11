async function awsS3DeleteObject(ctx, bucketName, objectName) {
  // For the Aws SDK documentation, see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html.
  const credentials = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const client = new S3(credentials);

  await client.deleteObject({ Bucket: bucketName, Key: objectName });
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
  name: 'S3 - Delete Object',
  description: 'Delete a specific object within S3 when passed in bucket name and object name.',
  code,
};
