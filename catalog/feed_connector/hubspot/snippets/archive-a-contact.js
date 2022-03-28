async function hubspotArchiveContact(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.archive(id);
}

const code = `
/** Archive a HubSpot contact.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 */
${hubspotArchiveContact.toString()}
`;

module.exports = {
  name: 'Archive a HubSpot contact',
  description: 'Archive a HubSpot contact',
  code,
};
