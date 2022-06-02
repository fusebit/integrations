async function mailchimpDeleteWebhook(ctx, listId, webhookId) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const deletedWebhook = await mailchimpWebhookClient.delete(listId, webhookId);

  return deletedWebhook;
}

const code = `
  /**
   * Delete a Mailchimp audience Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param listId {string} The identifier of the audience
   * @param webhookId {string} The identifier of the webhook to remove
   * @returns {object} Newly created webhook.
   */
  ${mailchimpDeleteWebhook.toString()}
  `;

module.exports = {
  name: 'Delete audience Webhook',
  description: 'Delete a Mailchimp audience Webhook',
  code,
};
