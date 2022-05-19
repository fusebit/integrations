async function mailchimpDeleteAllWebhooks(ctx) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  await mailchimpWebhookClient.deleteAll();
}

const code = `
  /**
   * Delete all Mailchimp Webhooks from all the Audiences
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   */
  ${mailchimpDeleteAllWebhooks.toString()}
  `;

module.exports = {
  name: 'Delete all Webhooks',
  description: 'Delete all Mailchimp Webhooks from all the Audiences',
  code,
};
