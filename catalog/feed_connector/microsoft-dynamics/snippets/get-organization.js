async function getOrganization(ctx) {
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return client.fusebit.credentials.params.organizationId;
}

const code = `
/**
 * Retrieves the OrganizationId associated to the tenant credentials.
 *
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @returns organizationId {string}
 */
${getOrganization.toString()}
    `;

module.exports = {
  name: 'Get Organization',
  description: 'Retrieves the OrganizationId associated to the tenant credentials.',
  code,
};
