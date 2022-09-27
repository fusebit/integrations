async function listCompanyOffices(ctx, companyId) {
  // For the Procore API documentation, see https://developers.procore.com/reference/rest/v1/company-offices?version=1.0
  const procoreClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await procoreClient.get(`/offices?company_id=${companyId}`);
}

const code = `
  /**
   * Returns a collection of Offices associated to a Company
   * 
   * @param ctx {FusebitContext} Fusebit Context
   * @param companyId {string} Unique identifier for the company.
   * @returns A list of company offices
   */
  ${listCompanyOffices.toString()}
  `;

module.exports = {
  name: 'Retrive company offices',
  description: 'Retrive Procore company offices',
  code,
};
