async function mailchimpGetWebhook(ctx, listId, webhookId) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const webhook = await mailchimpWebhookClient.get(listId, webhookId);

  return webhook;
}

const code = `
  /**
   * Get a Mailchimp audience Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param listId {string} The identifier of the audience
   * @param webhookId {string} The identifier of the webhook to get
   * @returns {object} Webhook
   */
  ${mailchimpGetWebhook.toString()}
  `;

module.exports = {
  name: 'Get Audience Webhook',
  description: 'Get Mailchimp Audience Webhook',
  code,
};
