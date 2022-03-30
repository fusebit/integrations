async function googleDocsGetDoc(ctx, documentId) {
  // For the Google SDK documentation, see {enter-url-here}.
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
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param documentId {string} Google Docs ID to Retrieve
 */
${googleDocsGetDoc.toString()}
`;

module.exports = {
  name: '{up-to-5-words-for-gallery-listing}',
  description: '{up-to-3-sentences-for-gallery-details}',
  code,
};
