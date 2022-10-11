async function awsS3ListObjects(ctx, bucketName) {
  // For the Aws SDK documentation, see {enter-url-here}.
  const credentials = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const client = new S3(credentials);

  const objects = await client.listObjectsV2();
  return objects.Contents;
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
  name: 'S3 - List Objects',
  description: 'List objects when given a s3 bucket name.',
  code,
};
