async function githubUpdateIssue(ctx, owner, repo, issueNumber, properties) {
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
    ...properties,
  });
  return data;
}

const code = `
/**
 * Update an existing Github issue. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param owner {string} Repository owner. 
 * @param repo {string} Repository name.
 * @param issueNumber {number} Issue number.
 * @param properties {object} Issue properties to update, e.g. 'title' or 'state'.
 * @returns {object} Updated issue.
 */
${githubUpdateIssue.toString()}
`;

module.exports = {
  name: 'Update an existing issue',
  description: 'Update an existing Github issue.',
  code,
};
