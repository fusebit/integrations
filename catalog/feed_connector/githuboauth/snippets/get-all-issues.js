async function githubGetAllIssues(ctx, ownerOrOrg, repo, otherProperties) {
  // For the Github API documentation, see https://github.com/octokit/octokit.js.
  const githubClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const orgLevel = typeof repo !== 'string';
  otherProperties = orgLevel
    ? {
        per_page: 100,
        org: ownerOrOrg,
        ...repo,
      }
    : {
        per_page: 100,
        owner: ownerOrOrg,
        repo,
        ...otherProperties,
      };

  const iterator = githubClient.paginate.iterator(
    orgLevel ? githubClient.rest.issues.listForOrg : githubClient.rest.issues.listForRepo,
    otherProperties
  );

  const issuesList = [];
  for await (const { data: issues } of iterator) {
    for (const issue of issues) {
      issuesList.push(issue);
    }
  }

  return issuesList;
}

const code = `
/**
 * Get all Github issues matching the search criteria. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param ownerOrOrg {string} Repository owner or organization name
 * @param repo {string} [undefined] Optional Repository name. 
 * @param otherProperties {object} [undefined] Optional additional criteria for matching issues. 
 * @returns {Array} Array of all issues matching the search criteria
 */
${githubGetAllIssues.toString()}
`;

module.exports = {
  name: 'Get all issues',
  description: 'Get all Github issues matching the search criteria.',
  code,
};
