async function githubCreateIssue(ctx, owner, repo, title, otherProperties) {
  // For the Github API documentation, see https://github.com/octokit/octokit.js.
  const githubClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { data } = await githubClient.rest.issues.create({
    owner,
    repo,
    title,
    ...otherProperties,
  });
  return data;
}

const code = `
/**
 * Create a new Github issue. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param owner {string} Repository owner. 
 * @param repo {string} Repository name.
 * @param title {string} New issue title.
 * @param otherProperties {object} [undefined] Optional additional issue properties. 
 * @returns {object} Newly created issue.
 */
${githubCreateIssue.toString()}
`;

module.exports = {
  name: 'Create a new issue',
  description: 'Create a new Github issue.',
  code,
};
