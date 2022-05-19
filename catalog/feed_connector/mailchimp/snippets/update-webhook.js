async function mailchimpUpdateWebhook(ctx, listId, webhookId) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  // This example updates the webhook secret, you can also update the events and sources properties.
  const updatedWebhook = await mailchimpWebhookClient.update({
    list_id: listId,
    id: webhookId,
    secret,
  });

  return updatedWebhook;
}

const code = `
  /**
   * Update a Mailchimp webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param listId {string} The identifier of the audience
   * @param webhookId {string} The identifier of the webhook to update
   * @returns {object} Updated Webhook
   */
  ${mailchimpUpdateWebhook.toString()}
  `;

module.exports = {
  name: 'Update audience Webhook',
  description: 'Update Mailchimp audience Webhook',
  code,
};
