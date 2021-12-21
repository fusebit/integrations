async function linearCreateIssue(ctx, data) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  data = data || {};
  if (!data.teamId) {
    // Default to the first team
    const teams = await linearClient.teams();
    data.teamId = teams.nodes[0].id;
  }
  return await linearClient.issueCreate(data);
}

const code = `
/**
 * Create a new Linear issue.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param data {object} Properties of the new issue
 * @returns {object} Newly ceated issue
 */
${linearCreateIssue.toString()}
`;

module.exports = {
  name: 'Create a new issue',
  description: 'Create a new Linear issue.',
  code,
};
