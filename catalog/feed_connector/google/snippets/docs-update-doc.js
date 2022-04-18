async function googleDocsUpdateDoc(ctx, documentId, documentText) {
  // For the Google SDK documentation, see https://developers.google.com/docs/api/reference/rest/v1/documents/batchUpdate
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await googleClient.docs('v1').documents.batchUpdate({
    documentId: documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: documentText,
          },
        },
      ],
    },
  });
}

const code = `
/**
 * Updated an existing Google Doc
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param documentId {string} Google Docs Id of the Document to Update
 * @param documentText {string} Text to update in the Google Docs
 */
${googleDocsUpdateDoc.toString()}
`;

module.exports = {
  name: 'Updated an existing Google Doc',
  description: 'Updated an existing Google Doc',
  code,
};
