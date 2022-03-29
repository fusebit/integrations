async function googleYoutubeGetComments(ctx, commentID) {
  // For the Google SDK documentation, see https://developers.google.com/youtube/v3/docs/
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const youtube = googleClient.youtube('v3');
  return await youtube.comments.list({
    part: 'id,snippet',
    parentId: commentID,
  });
}

const code = `
/**
 * Returns a list of comments that match the API request parameters
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param ctx {string} Parent ID of the Comment 
 */
${googleYoutubeGetComments.toString()}
`;

module.exports = {
  name: 'Get Comments from YouTube',
  description: 'Returns a list of comments that match the API request parameters',
  code,
};
