async function linearGetIssues(ctx, assigneeOrVariables) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  if (typeof assigneeOrVariables === 'string') {
    assigneeOrVariables = { filter: { assignee: { id: { eq: assigneeOrVariables } } } };
  }
  assigneeOrVariables = {
    first: 250,
    ...assigneeOrVariables,
  };
  return await linearClient.issues(assigneeOrVariables);
}

const code = `
/**
 * Get up to 250 Linear issues matching the search criteria. You can fetch additional pages 
 * by calling \`await result.fetchNext()\`. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param assigneeOrVariables {string|object} Assignee Id as string or Linear API search variables
 * @returns {object} Up to 250 matching Linear issues
 */
${linearGetIssues.toString()}
`;

module.exports = {
  name: 'Get issues',
  description: 'Get Linear issues matching the search criteria.',
  code,
};
