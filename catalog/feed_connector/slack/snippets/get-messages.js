async function slackGetMessages(ctx) {
  // For the Slack SDK documentation, see {enter-url-here}.
  const slackClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // TODO: replace with a really useful thing
  // return await slackClient.doUsefulThing();
}

const code = `
/**
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${slackGetMessages.toString()}
`;

module.exports = {
  name: '{up-to-5-words-for-gallery-listing}',
  description: '{up-to-3-sentences-for-gallery-details}',
  code,
};
