async function mailchimpListWebhooks(ctx, listId) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhooks = await mailchimpWebhookClient.list(listId);

  return webhooks;
}

const code = `
  /**
   * List audience webhooks
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param listId {string} The identifier of the audience
   * @returns {Array} Audience Webhooks list 
   */
  ${mailchimpListWebhooks.toString()}
  `;

module.exports = {
  name: 'List audience Webhooks',
  description: 'List Mailchimp audience Webhooks',
  code,
};
