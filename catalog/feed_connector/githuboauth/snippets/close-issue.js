async function githubCloseIssue(ctx, owner, repo, issueNumber) {
  // For the Github API documentation, see https://github.com/octokit/octokit.js.
  const githubClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { data } = await githubClient.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
  });
  return data;
}

const code = `
/**
 * Close an existing Github issue. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param owner {string} Repository owner. 
 * @param repo {string} Repository name.
 * @param issueNumber {number} Issue number.
 * @returns {object} Closed issue.
 */
${githubCloseIssue.toString()}
`;

module.exports = {
  name: 'Close an existing issue',
  description: 'Close an existing Github issue.',
  code,
};
