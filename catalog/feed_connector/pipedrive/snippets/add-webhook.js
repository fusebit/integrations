async function pipedriveAddWebhook(ctx) {
  // For the Pipedrive SDK documentation, see https://developers.pipedrive.com/docs/api/v1.
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
 * Add a webhook to Pipedrive to send changes to Fusebit.
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
