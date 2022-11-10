const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'clearbitConnector';

// Test Endpoint: Get company details associated to a domain. By default will use fusebit.io domain
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const clearbitClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // API Reference: https://dashboard.clearbit.com/docs?shell#enrichment-api-company-api-domain-lookup
  const companyApi = clearbitClient.makeApiClient('company', 'v2');
  const domain = ctx.query.domain || 'fusebit.io';
  const { legalName, description, foundedYear } = await companyApi.get(`companies/find?domain=${domain}`);

  ctx.body = `Got details for ${domain}, legal name: ${legalName}, founded: ${foundedYear}, description: ${description}`;
});

// Endpoint for Sample App: Retrieve a list of companies from Clearbit
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const clearbitClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  const discoveryApi = clearbitClient.makeApiClient('discovery', 'v1');
  const { results } = await discoveryApi.get(
    'companies/search?query=tags:"Information Technology %26 Services" employees:50~1000 location:"san francisco"&limit=10&sort=alexa_asc&page_size=10&page=1'
  );

  ctx.body = results.map((company) => ({
    name: company.name,
    domain: company.domain,
  }));
});

module.exports = integration;
