async function googleDocsCreateDoc(ctx) {
  // For the Google SDK documentation, see https://developers.google.com/docs/api/reference/rest/v1/documents/create
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await googleClient.docs('v1').documents.create({
    title: 'Fusebit Hello World',
  });
}

const code = `
/**
 * Create a new Google Doc
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${googleDocsCreateDoc.toString()}
`;

module.exports = {
  name: 'Create a new Google Doc',
  description: 'Create a new Google Doc',
  code,
};
