async function listContacts(ctx, maxPageSize = 10) {
  // For the Microsoft Dynamics SDK documentation, see https://learn.microsoft.com/en-us/previous-versions/dynamicscrm-2016/developers-guide/mt593051(v=crm.8)
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const request = {
    collection: 'contacts',
    select: ['firstname', 'lastname'],
    maxPageSize,
    count: true,
  };

  const { value, oDataCount } = await client.retrieveMultipleRequest(request);
  return { contacts: value, count: oDataCount };
}

const code = `
    /**
     * List Contacts from your Microsoft Dynamics Customer Service Instance
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param maxPageSize {string} Limit the total number of Contacts to return
     * @returns {object} Contacts with total count
     */
    ${listContacts.toString()}
    `;

module.exports = {
  name: 'List Contacts',
  description: 'List Contacts from your Microsoft Dynamics Customer Service Instance',
  code,
};
