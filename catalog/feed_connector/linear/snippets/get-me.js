async function linearGetMe(ctx) {
  // For the Linear SDK documentation, see https://developers.linear.app/docs/sdk/getting-started
  const linearClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return await linearClient.viewer;
}

const code = `
/**
 * Get details of authorized user. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns {object} Authorized Linear user.
 */
${linearGetMe.toString()}
`;

module.exports = {
  name: 'Get authorized user',
  description: 'Get authorized Linear user.',
  code,
};
