async function zoomGetMeeting(ctx, meetingId) {
  // For the Zoom SDK documentation, see https://marketplace.zoom.us/docs/api-reference/zoom-api/methods
  const zoomClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await zoomClient.get(`/meetings/${meetingId}`);
}

const code = `
/**
 * Get Meeting Details
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param meetingId {int} Meeting ID 
 */
${zoomGetMeeting.toString()}
`;

module.exports = {
  name: 'Get Meeting Details',
  description: 'Get Meeting Details',
  code,
};
