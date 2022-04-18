async function twitterPostTweet(ctx, tweetText) {
  // For the Twitter SDK documentation, see https://github.com/plhery/node-twitter-api-v2
  const twitterClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const { data: createdTweet } = await twitterClient.v2.tweet(tweetText);

  return createdTweet;
}

const code = `
/**
 * Post a Tweet
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param tweetText {string} Message to Tweet
 */
${twitterPostTweet.toString()}
`;

module.exports = {
  name: 'Post a Tweet',
  description: 'Post a Tweet',
  code,
};
