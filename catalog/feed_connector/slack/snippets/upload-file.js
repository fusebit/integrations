async function slackUploadFile(ctx, payload) {
  // For the Slack SDK documentation, see https://slack.dev/node-slack-sdk/web-api.
  const slackClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  if (!payload?.channels) {
    // Use the Slack user ID of the authorized user as the channel ID to send a Direct Message
    payload.channels = slackClient.fusebit.credentials.authed_user.id;
  }

  return slackClient.files.upload(payload);
}

const code = `
/**
 * Upload a file to a Slack channel. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param message {payload} The file upload payload.
 */
${slackUploadFile.toString()}
`;

module.exports = {
  name: 'Upload a file to a channel',
  description: 'Upload a file to a Slack channel.',
  code,
};
