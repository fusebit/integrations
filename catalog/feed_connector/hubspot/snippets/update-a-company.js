async function hubspotUpdateCompany(ctx, id, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.update(id, { properties });
}

const code = `
/** Update properties of a HubSpot company.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 * @param properties {object} Company properties to add or modify
 */
${hubspotUpdateCompany.toString()}
`;

module.exports = {
  name: 'Update properties of a HubSpot company',
  description: 'Update properties of a HubSpot company',
  code,
};
