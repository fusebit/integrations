async function getUser(ctx, uuid) {
  // Learn more at https://developer.calendly.com/api-docs/ff9832c5a6640-get-user
  const calendlyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return calendlyClient.get(`/users/${uuid}`);
}

const code = `
    /**
     * Get information about a specified User.
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param uuid {string} User unique identifier, or the constant "me" to reference the caller
     */
    ${getUser.toString()}
    `;

module.exports = {
  name: 'Get information about a specified User.',
  description: 'Get information about a specified User or the authorized caller',
  code,
};
