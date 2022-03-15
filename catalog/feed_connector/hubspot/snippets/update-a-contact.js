async function hubspotUpdateContact(ctx, id, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.update(id, { properties });
}

const code = `
/** Update properties of a HubSpot contact.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 * @param properties {object} Contact properties to add or modify
 */
${hubspotUpdateContact.toString()}
`;

module.exports = {
  name: 'Update properties of a HubSpot contact',
  description: 'Update properties of a HubSpot contact',
  code,
};
