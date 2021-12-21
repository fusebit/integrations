async function atlassianJiraGetIssues(ctx, jql, params) {
  // For the Atlassian SDK documentation, see https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/.
  const atlassianClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  params = params || {};
  if (jql) {
    params.jql = jql;
  }
  let resourceId = params.resourceId;
  delete params.resourceId;
  if (!resourceId) {
    const resources = await atlassianClient.getAccessibleResources('jira');
    if (resources.length === 0) {
      ctx.throw(404, 'No Jira resources are available in the Atlassian account.');
    }
    resourceId = resources[0].id;
  }
  const issues = await atlassianClient.jira(resourceId).get(
    `/search?${Object.keys(params)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&')}`
  );
  return issues;
}

const code = `
/**
 * Get Jira issues matching the JQL search criteria. If no JQL is specified, all issues are returned.
 * For JQL syntax, see https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/.
 * Use 'params' to specify resourceId, maxResults, startAt, and other parameters specified at 
 * https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-get.
 * If 'params.resourceId' is not specified, the first Jira resource of the Atlassian account is used.
 * 
 * @example await atlassianJiraGetIssues(ctx);
 * @example await atlassianJiraGetIssues(ctx, "project = 'DEMO'", { maxResults: 5 });
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param jql {string} Optional JQL query to narrow down the search results
 * @param params {object} 
 * @returns {object} Atlassian Jira resources
 */
${atlassianJiraGetIssues.toString()}
`;

module.exports = {
  name: 'Get Jira issues',
  description: 'Get Jira issues matching the JQL search criteria.',
  code,
};
