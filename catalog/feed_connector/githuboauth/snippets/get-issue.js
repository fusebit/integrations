async function githubGetIssue(ctx, owner, repo, issueNumber) {
  // For the Github API documentation, see https://github.com/octokit/octokit.js.
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  const githubClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const { data } = await githubClient.rest.issues.get({ owner, repo, issue_number: issueNumber });
  return data;
}

const code = `
/**
 * Get Github issue details. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param owner {string} Repository owner. 
 * @param repo {string} Repository name.
 * @param issueNumber {number} Issue number.
 * @returns {object} Github issue.
 */
${githubGetIssue.toString()}
`;

module.exports = {
  name: 'Get issue details',
  description: 'Get Github issue details.',
  code,
};
