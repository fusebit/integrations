async function googleYoutubeSearchVideos(ctx, searchTerm) {
  // For the YouTube SDK documentation, see https://developers.google.com/youtube/v3/docs
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const youtube = googleClient.youtube('v3');
  return await youtube.comments.list({
    part: 'snippet',
    maxResults: 25,
    q: searchTerm,
  });
}

const code = `
/**
 * Search YouTube Videos, Playlists or Channels by Keyword
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param searchTerm {string} Keyword to Search Youtube
 */
${googleYoutubeSearchVideos.toString()}
`;

module.exports = {
  name: 'Search YouTube',
  description: 'Search YouTube Videos, Playlists or Channels by Keyword',
  code,
};
