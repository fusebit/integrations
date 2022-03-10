async function atlassianConfluenceGetContentById(ctx, contentId) {
  const atlassianClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const resources = await atlassianClient.getAccessibleResources('confluence');
  if (resources.length === 0) {
    ctx.throw(404, 'No Matching Account found in Atlassian');
  }

  const confluenceCloud = resources[0];
  const confluence = atlassianClient.confluence(confluenceCloud.id);

  const confluencePages = await confluence.get(`/content/${contentId}`);

  return confluencePages;
}

const code = `
/**
 * Get Confluence Content by ID
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param contentId {ContentID} Id of the  content you want to retrieve
 */
${atlassianConfluenceGetContentById.toString()}
`;

module.exports = {
  name: 'Get Confluence Content by ID',
  description: 'Get Confluence Content by ID',
  code,
};
