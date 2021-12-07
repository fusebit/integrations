async function slackListUsers(ctx) {
  // For the Slack SDK documentation, see https://slack.dev/node-slack-sdk/web-api.
  const slackClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return slackClient.users.list();
}

const code = `
/**
 * List users of the Slack workspace. 
 * 
 * @param ctx {FusebitContext} Fusebit Context of the request
 */
${slackListUsers.toString()}
`;

module.exports = {
  name: 'List workspace users',
  description: 'List users of the Slack workspace',
  code,
};
