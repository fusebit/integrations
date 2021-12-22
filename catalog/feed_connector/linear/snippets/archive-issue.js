async function linearArchiveIssue(ctx, id) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await linearClient.issueArchive(id);
}

const code = `
/**
 * Archive Linear issue.
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param id {string} Issue Id
 * @returns {object} Archived Linear issue
 */
${linearArchiveIssue.toString()}
`;

module.exports = {
  name: 'Archive issue',
  description: 'Archive Linear issue by Id.',
  code,
};
