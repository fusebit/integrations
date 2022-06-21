async function pipedriveDeleteAllWebhook(ctx) {
  // For the Pipedrive SDK documentation, see {enter-url-here}.
  const pipedriveWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await pipedriveWebhookClient.deleteAll();
}

const code = `
/**
 * {brief-jsdocs-function-description-of-a-snippet-for-intellisense}.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 */
${pipedriveDeleteAllWebhook.toString()}
`;

module.exports = {
  name: 'Delete All Pipedrive Webhooks',
  description: 'Delete all Pipedrive webhooks.',
  code,
};
