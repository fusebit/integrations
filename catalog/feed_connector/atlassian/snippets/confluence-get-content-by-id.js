async function atlassianConfluenceGetContentById(ctx) {
  // For the Atlassian SDK documentation, see {enter-url-here}.
  const atlassianClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // TODO: replace with a really useful thing
  // return await atlassianClient.doUsefulThing();
}

const code = `
/**
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${atlassianConfluenceGetContentById.toString()}
`;

module.exports = {
  name: '{up-to-5-words-for-gallery-listing}',
  description: '{up-to-3-sentences-for-gallery-details}',
  code,
};
