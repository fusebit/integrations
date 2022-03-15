async function hubspotGetCompanies(ctx) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.getAll();
}

const code = `
/**
 * Get all HubSpot companies.
 *
 * @param ctx {FusebitContext} Fusebit Context
 */
${hubspotGetCompanies.toString()}
`;

module.exports = {
  name: 'Get all HubSpot companies.',
  description: 'Get all HubSpot companies.',
  code,
};
