async function zoomCreateMeeting(ctx) {
  // For the Zoom SDK documentation, see https://marketplace.zoom.us/docs/api-reference/zoom-api/methods
  const zoomClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await zoomClient.post('/users/me/meetings');
}

const code = `
/**
 * Create a new Zoom Meeting
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${zoomCreateMeeting.toString()}
`;

module.exports = {
  name: 'Create a new Zoom Meeting',
  description: 'Create a new Zoom Meeting',
  code,
};
