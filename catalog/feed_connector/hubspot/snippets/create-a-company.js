async function hubspotCreateCompany(ctx, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.create({ properties });
}

const code = `
/** Create a new HubSpot company.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new company
 */
${hubspotCreateCompany.toString()}
`;

module.exports = {
  name: 'Create a new HubSpot company',
  description: 'Create a new HubSpot company',
  code,
};
