async function sfdcRunQuery(ctx, soql) {
  // For the Salesforce SDK documentation, see https://jsforce.github.io/.
  const sfdcClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await sfdcClient.query(soql || 'SELECT count() FROM Contact');
}

async function sfdcRunQueryMore(ctx, nextRecordsUrl) {
  // For the Salesforce SDK documentation, see https://jsforce.github.io/.
  const sfdcClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await sfdcClient.queryMore(nextRecordsUrl);
}

const code = `
/**
 * Run Salesforce SOQL query.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param soql {string} Salesforce SOQL query
 */
${sfdcRunQuery.toString()}

/**
 * Get more results for a previously ran Salesforce SOQL query.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param nextRecordsUrl {string} The nextRecordsUrl returned from previous, partial query result.
 */
${sfdcRunQueryMore.toString()}
`;

module.exports = {
  name: 'Run SOQL query',
  description: 'Run a SOQL query in Salesforce.',
  code,
};
