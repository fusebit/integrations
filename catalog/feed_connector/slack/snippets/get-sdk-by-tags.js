async function slackGetSdkByTags(ctx) {
  const { team_id, user_id, api_app_id: app_id } = ctx.req.body.data;

  const installs = await integration.webhook.searchInstalls(ctx, '<% connectorName %>', {
    app_id,
    team_id,
    user_id,
  });

  // For the Slack SDK documentation, see https://slack.dev/node-slack-sdk/web-api.
  const slackClient = await integration.service.getSdk(ctx, '<% connectorName %>', installs[0].id);

  return slackClient;
}

const code = `
  /**
   * Get an authenticated Slack SDK using a set of Webhook tags: Team, Application id and User id.
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   */
  ${slackGetSdkByTags.toString()}
  `;

module.exports = {
  name: 'Get SDK by Webhook tags',
  description: 'Get an authenticated Slack SDK using a set of Webhook tags: Team, Application id and User id.',
  code,
};
