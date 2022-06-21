async function pipedriveDeleteAllWebhook(ctx) {
  // For the Pipedrive SDK documentation, see https://developers.pipedrive.com/docs/api/v1.
  const pipedriveWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await pipedriveWebhookClient.deleteAll();
}

const code = `
/**
 * Delete all webhooks within Pipedrive.
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
