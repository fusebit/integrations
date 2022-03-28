async function hubspotGetCompanies(ctx) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.getAll();
}

async function hubspotGetCompany(ctx, id) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.getById(id);
}

async function hubspotUpdateCompany(ctx, id, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.update(id, { properties });
}

/** Create a new HubSpot contact.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new contact
 */
async function hubspotCreateCompany(ctx, properties) {
  // For the HubSpot SDK documentation, see https://github.com/HubSpot/hubspot-api-nodejs.
  const hubspotClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );
  return hubspotClient.crm.companies.basicApi.create({ properties });
}

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
/**
 * Get all HubSpot companies.
 *
 * @param ctx {FusebitContext} Fusebit Context
 */
${hubspotGetCompanies.toString()}

/**
 * Get HubSpot company by ID.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 */
${hubspotGetCompany.toString()}

/** Update properties of a HubSpot company.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 * @param properties {object} Company properties to add or modify
 */
${hubspotUpdateCompany.toString()}

/** Create a new HubSpot company.
 *
 * @param ctx {FusebitContext} Fusebit Context
 * @param properties {object} Properties of the new company
 */
${hubspotCreateCompany.toString()}

/** Archive a HubSpot company.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param id {string|number} HubSpot company ID
 */
${hubspotArchiveCompany.toString()}
`;

module.exports = {
  name: 'Create, get, update, or delete companies',
  description: 'Perform basic operations on HubSpot companies.',
  code,
};
