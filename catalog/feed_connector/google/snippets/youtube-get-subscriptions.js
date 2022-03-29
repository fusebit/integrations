async function googleYoutubeGetSubscriptions(ctx) {
  // For the Google SDK documentation, see https://developers.google.com/youtube/v3/docs/
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const youtube = googleClient.youtube('v3');

  return await youtube.subscriptions.list({
    part: 'snippet,contentDetails',
    mine: true,
  });
}

const code = `
/**
 * Return a list of channels that subscribe to the authenticated user's channel
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${googleYoutubeGetSubscriptions.toString()}
`;

module.exports = {
  name: 'Get Subscriptions',
  description: "Return a list of channels that subscribe to the authenticated user's channel",
  code,
};
