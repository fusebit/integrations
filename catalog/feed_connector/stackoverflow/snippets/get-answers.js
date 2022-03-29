async function stackoverflowGetAnswers(ctx) {
  // For the Stackoverflow SDK documentation, see https://api.stackexchange.com/docs
  const stackoverflowClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await stackoverflowClient.site('stackoverflow').get('/answers');
}

const code = `
/**
 * Gets all undeleted answers on the site
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${stackoverflowGetAnswers.toString()}
`;

module.exports = {
  name: 'Gets all undeleted answers on the site',
  description: 'Gets all undeleted answers on the site',
  code,
};
