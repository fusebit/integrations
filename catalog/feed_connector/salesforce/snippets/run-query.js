async function sfdcRunQuery(ctx, jql) {
  // For the Salesforce SDK documentation, see https://jsforce.github.io/.
  const sfdcClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await sfdcClient.query(jql || 'SELECT count() FROM Contact');
}

const code = `
/**
 * Run Salesforce JQL query.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param jql {string} Salesforce JQL query
 */
${sfdcRunQuery.toString()}
`;

module.exports = {
  name: 'Run JQL query',
  description: 'Run a JQL query in Salesforce.',
  code,
};
