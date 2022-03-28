async function hubspotGetCompany(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.getById(id);
}

const code = `

/**
 * Get HubSpot company by ID.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 */
${hubspotGetCompany.toString()}
`;

module.exports = {
  name: 'Get HubSpot company by ID',
  description: 'Get HubSpot company by ID',
  code,
};
