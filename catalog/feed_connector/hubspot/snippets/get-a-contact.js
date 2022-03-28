async function hubspotGetContact(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.getById(id);
}

const code = `
/**
 * Get HubSpot contact by ID.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 */
${hubspotGetContact.toString()}
`;

module.exports = {
  name: 'Get HubSpot contact by ID',
  description: 'Get HubSpot contact by ID',
  code,
};
