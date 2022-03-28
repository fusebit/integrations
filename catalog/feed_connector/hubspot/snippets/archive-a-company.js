async function hubspotArchiveCompany(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.archive(id);
}

const code = `
/** Archive a HubSpot company.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 */
${hubspotArchiveCompany.toString()}
`;

module.exports = {
  name: 'Archive a HubSpot company',
  description: 'Archive a HubSpot company',
  code,
};
