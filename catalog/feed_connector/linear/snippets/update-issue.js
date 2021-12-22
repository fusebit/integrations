async function linearUpdateIssue(ctx, id, data) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await linearClient.issueUpdate(id, data);
}

const code = `
/**
 * Update an existing Linear issue.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param data {id} Issue Id
 * @param data {object} Properties to be updated
 * @returns {object} Updated issue
 */
${linearUpdateIssue.toString()}
`;

module.exports = {
  name: 'Update an existing issue',
  description: 'Update an existing Linear issue.',
  code,
};
