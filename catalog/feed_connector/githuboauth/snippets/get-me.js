async function githubGetMe(ctx) {
  // For the Github API documentation, see https://github.com/octokit/octokit.js.
  const githubClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { data } = await githubClient.rest.users.getAuthenticated();
  return data;
}

const code = `
/**
 * Get details of the authenticated Github user. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {object} Github user
 */
${githubGetMe.toString()}
`;

module.exports = {
  name: 'Get authenticated user',
  description: 'Get details of the authenticated Github user.',
  code,
};
