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

  const confluencePages = await confluence.get(`/content/${contentId}/child/comment`);

  return confluencePages;
}

const code = `
/**
 * Get Comments on a Content
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param contentId {ContentID} Id of the  content you want to retrieve comments for
 */
${atlassianConfluenceGetContentById.toString()}
`;

module.exports = {
  name: 'Get Comments on a Content',
  description: 'Get Comments on a Content',
  code,
};
