async function asanaGetMe(ctx) {
  // For the Asana SDK documentation, see https://github.com/Asana/node-asana
  const asanaClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await asanaClient.users.me();
}

const code = `
/**
 * Get details of authorized user. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {object} Authorized Asana user.
 */
${asanaGetMe.toString()}
`;

module.exports = {
  name: 'Get authorized user',
  description: 'Get authorized Asana user.',
  code,
};
