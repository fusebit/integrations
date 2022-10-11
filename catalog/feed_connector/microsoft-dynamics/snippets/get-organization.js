async function getOrganization(ctx) {
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { OrganizationId } = await client.executeUnboundFunction('WhoAmI');
  return OrganizationId;
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
