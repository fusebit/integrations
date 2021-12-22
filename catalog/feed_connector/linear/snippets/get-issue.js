async function linearGetIssue(ctx, id) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await linearClient.issue(id);
}

const code = `
/**
 * Get Linear issue by Id.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param id {string} Issue Id
 * @returns {object} Linear issue
 */
${linearGetIssue.toString()}
`;

module.exports = {
  name: 'Get issue',
  description: 'Get Linear issue by Id.',
  code,
};
