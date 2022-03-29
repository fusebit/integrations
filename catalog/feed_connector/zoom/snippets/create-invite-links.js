async function zoomCreateInviteLinks(ctx, meetingId) {
  // For the Zoom SDK documentation, see https://marketplace.zoom.us/docs/api-reference/zoom-api/methods
  const zoomClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await zoomClient.post(`/meetings/${meetingId}/invite_links`);
}

const code = `
/**
 * Generate Invite Links for Meetings
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param meetingId {int} Meeting ID to create links for
 */
${zoomCreateInviteLinks.toString()}
`;

module.exports = {
  name: 'Generate Invite Links for Meetings',
  description: 'Generate Invite Links for Meetings',
  code,
};
