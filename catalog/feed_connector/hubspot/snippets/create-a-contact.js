async function hubspotCreateContact(ctx, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.create({ properties });
}

const code = `
/** Create a new HubSpot contact.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new contact
 */
${hubspotCreateContact.toString()}
`;

module.exports = {
  name: 'Create a new HubSpot contact',
  description: 'Create a new HubSpot contact',
  code,
};
