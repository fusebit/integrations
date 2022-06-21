async function pipedriveAddWebhook(ctx) {
  // For the Pipedrive SDK documentation, see {enter-url-here}.
  const pipedriveWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return pipedriveWebhookClient.create({
    event_action: '*',
    event_object: '*',
  });
}

const code = `
/**
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${pipedriveAddWebhook.toString()}
`;

module.exports = {
  name: 'Add New Pipedrive Webhook',
  description: 'Create a new Pipedrive webhook.',
  code,
};
