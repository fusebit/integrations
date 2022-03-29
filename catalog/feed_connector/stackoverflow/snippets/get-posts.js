async function stackoverflowGetPosts(ctx) {
  // For the Stackoverflow SDK documentation, see https://api.stackexchange.com/docs
  const stackoverflowClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await stackoverflowClient.site('stackoverflow').get('/posts');
}

const code = `
/**
 * Fetches all posts (questions and answers) on the site
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${stackoverflowGetPosts.toString()}
`;

module.exports = {
  name: 'Fetch all posts (questions and answers) on the site',
  description: 'Fetch all posts (questions and answers) on the site',
  code,
};
