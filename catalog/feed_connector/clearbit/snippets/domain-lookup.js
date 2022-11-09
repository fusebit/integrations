async function domainLookup(ctx, domain) {
  // Learn more at https://dashboard.clearbit.com/docs?shell#enrichment-api-company-api
  const clearbitClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const companyApi = clearbitClient.makeApiClient('company', 'v2');
  return companyApi.get(`companies/find?domain=${domain}`);
}

const code = `
    /**
     * Lookup company data via a domain name
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param domain {string} The company domain to use
     * @returns Company details
     */
    ${domainLookup.toString()}
    `;

module.exports = {
  name: 'Lookup company data via a domain name',
  description: "The Clearbit's Company API lets you lookup company data via a domain name",
  code,
};
