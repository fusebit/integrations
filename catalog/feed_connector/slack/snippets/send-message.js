async function slackSendMessage(ctx, message, channel) {
  // For the Slack SDK documentation, see https://slack.dev/node-slack-sdk/web-api.
  const slackClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  if (!channel) {
    // Use the Slack user ID of the authorized user as the channel ID to send a Direct Message
    channel = slackClient.fusebit.credentials.authed_user.id;
  }

  return typeof message === 'object'
    ? slackClient.chat.postMessage({
        channel,
        ...message,
      })
    : slackClient.chat.postMessage({
        channel,
        text: message || 'Hello world from Fusebit!',
      });
}

const code = `
/**
 * Sends a message to a Slack channel. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 * @param message {string|object} The message (in Slack markdown) to send, or the postMessage payload (advanced).
 * @param {channel} [undefined] Optional Slack channel ID or channel name to send the message to. If not specified, a DM is sent.
 */
${slackSendMessage.toString()}
`;

module.exports = {
  name: 'Send a message to a channel',
  description: 'Send a message to a Slack channel.',
  code,
};
