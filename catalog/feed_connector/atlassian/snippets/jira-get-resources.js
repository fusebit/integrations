async function atlassianJiraGetResources(ctx) {
  // For the Atlassian SDK documentation, see https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/.
  const atlassianClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await atlassianClient.getAccessibleResources('jira');
}

const code = `
/**
 * Get Jira resources available on the Atlassian account.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {object} Atlassian Jira resources
 */
${atlassianJiraGetResources.toString()}
`;

module.exports = {
  name: 'Get Jira resources',
  description: 'Get Jira resources available on the Atlassian account.',
  code,
};
