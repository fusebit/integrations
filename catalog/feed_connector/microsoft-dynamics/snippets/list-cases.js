async function listCases(ctx, maxPageSize = 10) {
  // For the Microsoft Dynamics SDK documentation, see https://github.com/AleksandrRogov/DynamicsWebApi/wiki/api-classes-dynamicswebapi
  const client = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const request = {
    collection: 'incidents',
    select: ['title', 'ticketnumber'],
    maxPageSize,
    count: true,
  };

  const { value, oDataCount } = await client.retrieveMultipleRequest(request);
  return { cases: value, count: oDataCount };
}

const code = `
    /**
     * List Cases from your Microsoft Dynamics Customer Service Instance
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param maxPageSize {string} Limit the total number of Cases to return
     * @returns {object} Cases with total count
     */
    ${listCases.toString()}
    `;

module.exports = {
  name: 'List Cases',
  description: 'List Cases from your Microsoft Dynamics Customer Service Instance',
  code,
};
