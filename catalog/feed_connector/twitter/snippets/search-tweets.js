async function twitterSearchTweets(ctx, searchTerm) {
  // For the Twitter SDK documentation, see https://github.com/plhery/node-twitter-api-v2
  const twitterClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await twitterClient.v2.search(searchTerm);
}

const code = `
/**
 * Search tweets of the last 7 days with a text query
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param searchTerm {string} Term to Search Twitter
 */
${twitterSearchTweets.toString()}
`;

module.exports = {
  name: 'Search Tweets',
  description: 'Search tweets of the last 7 days with a text query',
  code,
};
