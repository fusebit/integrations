async function hubspotGetContacts(ctx) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.getAll();
}

async function hubspotGetContact(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.getById(id);
}

async function hubspotUpdateContact(ctx, id, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.update(id, { properties });
}

/** Create a new HubSpot contact.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new contact
 */
async function hubspotCreateContact(ctx, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.contacts.basicApi.create({ properties });
}

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
/**
 * Get all HubSpot contacts.
 *
 * @param ctx {FusebitContext} Fusebit Context
 */
${hubspotGetContacts.toString()}

/**
 * Get HubSpot contact by ID.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 */
${hubspotGetContact.toString()}

/** Update properties of a HubSpot contact.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 * @param properties {object} Contact properties to add or modify
 */
${hubspotUpdateContact.toString()}

/** Create a new HubSpot contact.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new contact
 */
${hubspotCreateContact.toString()}

/** Archive a HubSpot contact.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot contact ID
 */
${hubspotArchiveContact.toString()}
`;

module.exports = {
  name: 'Create, get, update, or delete contacts',
  description: 'Perform basic operations on HubSpot contacts.',
  code,
};
