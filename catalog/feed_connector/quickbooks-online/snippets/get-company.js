async function quickbooksGetCompany(ctx, companyID) {
  // For the Quickbooks-online SDK documentation, see https://github.com/mcohen01/node-quickbooks
  const quickbooksClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await quickbooksClient.getCompanyInfo(companyID);
}

const code = `
/**
 * Get CompanyInfo from Quickbooks
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param companyID {string} Company ID to get info for
 */
${quickbooksGetCompany.toString()}
`;

module.exports = {
  name: 'Get Company Information from Quickbooks',
  description: 'Get Company Information from Quickbooks',
  code,
};
