async function createNewCase(ctx, title, description, contactId) {
  // For the Microsoft Dynamics SDK documentation, see https://github.com/AleksandrRogov/DynamicsWebApi/wiki/api-classes-dynamicswebapi
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const newCase = {
    title,
    description,
  };

  newCase['customerid_contact@odata.bind'] = `/contacts(${contactId})`;
  const response = await client.create(newCase, 'incidents');

  return response;
}

const code = `
    /**
     * Create a new Microsoft Dynamics Customer Service Case
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param title {string} The title of the Case
     * @param description {string} The description of the Case
     * @returns {object} Newly created Case
     */
    ${createNewCase.toString()}
    `;

module.exports = {
  name: 'Create new Case',
  description: 'Create a new Microsoft Dynamics Customer Service Case',
  code,
};
