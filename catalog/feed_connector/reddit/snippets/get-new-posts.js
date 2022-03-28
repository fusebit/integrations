async function redditGetNewPosts(ctx, subredditName, options) {
  // For the Reddit SDK documentation, see https://github.com/not-an-aardvark/snoowrap
  const redditClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await redditClient.getNew(subredditName, options);
}

const code = `
/**
 * Gets a listing of new posts
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from the front page of reddit.
 * @param {object} [options={}] Options for the resulting Listing
 * @returns {Promise} A Listing containing the retrieved submissions
 */
${redditGetNewPosts.toString()}
`;

module.exports = {
  name: 'Gets a listing of new posts',
  description:
    'Gets a listing of new posts, If a Subreddit is not provided, posts are fetched from the front page of reddit.',
  code,
};
