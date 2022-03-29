async function stackoverflowGetComments(ctx) {
  // For the Stackoverflow SDK documentation, see https://api.stackexchange.com/docs
  const stackoverflowClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // If you're filtering for interesting comments (by score, creation date, etc.) make use of the sort parameter
  return await stackoverflowClient.site('stackoverflow').get('/comments?sort=votes');
}

const code = `
/**
 * Fetches all comments on the site
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${stackoverflowGetComments.toString()}
`;

module.exports = {
  name: 'Fetches all comments on the site',
  description: 'Fetches all comments on the site',
  code,
};
