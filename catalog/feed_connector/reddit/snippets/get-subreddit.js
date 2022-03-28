async function redditGetSubreddit(ctx, subredditName) {
  // For the Reddit SDK documentation, see https://github.com/not-an-aardvark/snoowrap
  const redditClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await redditClient.getSubreddit(subredditName);
}

const code = `
/**
 * Get information on a given subreddit
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param subredditName {string} The name of the subreddit (e.g. 'AskReddit')
 * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
 */
${redditGetSubreddit.toString()}
`;

module.exports = {
  name: 'Get information on a given subreddit',
  description: 'Get information on a given subreddit',
  code,
};
