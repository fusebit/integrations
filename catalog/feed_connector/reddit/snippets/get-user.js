async function redditGetUser(ctx, userName) {
  // For the Reddit SDK documentation, see https://github.com/not-an-aardvark/snoowrap
  const redditClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await redditClient.getUser(userName);
}

const code = `
/**
 * Get information on a reddit user 
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param userName {string} The Reddit Username
 * @returns {RedditUser} RedditUser object for the requested user
 */
${redditGetUser.toString()}
`;

module.exports = {
  name: '{up-to-5-words-for-gallery-listing}',
  description: '{up-to-3-sentences-for-gallery-details}',
  code,
};
