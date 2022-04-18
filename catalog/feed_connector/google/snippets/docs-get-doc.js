async function googleDocsGetDoc(ctx, documentId) {
  // For the Google SDK documentation, see https://developers.google.com/docs/api/reference/rest/v1/documents/create
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await googleClient.docs('v1').documents.get({
    documentId: documentId,
  });
}

const code = `
/**
 * Get Google Doc
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param documentId {string} Google Docs ID to Retrieve
 */
${googleDocsGetDoc.toString()}
`;

module.exports = {
  name: 'Get a Google Doc',
  description: 'Get a Google Doc using documentId',
  code,
};
