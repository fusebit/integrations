async function gitlabGetCommits(ctx, projectId) {
  // For the GitLab SDK documentation, see https://github.com/jdalrymple/gitbeaker
  const gitlabClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await gitlabClient.Commits.all(projectId, {
    maxPages: 1,
  });
}

const code = `
/**
 * Get list of commits by Project ID
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param projectId {int}
 */
${gitlabGetCommits.toString()}
`;

module.exports = {
  name: 'Get list of commits by Project ID',
  description: 'Get list of commits by Project ID',
  code,
};
