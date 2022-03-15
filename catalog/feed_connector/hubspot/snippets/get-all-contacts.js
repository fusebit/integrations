async function hubspotGetContacts(ctx) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.getAll();
}

const code = `
/**
 * Get all HubSpot contacts.
 *
 * @param ctx {FusebitContext} Fusebit Context
 */
${hubspotGetContacts.toString()}
`;

module.exports = {
  name: 'Get all HubSpot contacts',
  description: 'Get all HubSpot contacts',
  code,
};
