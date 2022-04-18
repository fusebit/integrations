async function twitterPostThread(ctx, tweetThreadText) {
  // For the Twitter SDK documentation, see https://github.com/plhery/node-twitter-api-v2
  const twitterClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await twitterClient.v2.tweetThread(tweetThreadText);
}

const code = `
/**
 * Post a Twitter Thread
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param tweetThreadText {string[]} Thread to post
 */
${twitterPostThread.toString()}
`;

module.exports = {
  name: 'Post a Twitter Thread',
  description: 'Post a Twitter Thread using an array of strings',
  code,
};
