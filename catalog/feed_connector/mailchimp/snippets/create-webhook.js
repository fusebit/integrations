async function mailchimpCreateWebhook(ctx, listId) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/api/list-webhooks/
  const mailchimpWebhookClient = await integration.webhook.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const createdWebhook = await mailchimpWebhookClient.create({
    list_id: listId,
    secret: 'super-secure-secret-here',
    events: {
      subscribe: true,
      unsubscribe: true,
    },
    sources: {
      user: true,
      admin: true,
      api: true,
    },
  });

  return createdWebhook;
}

const code = `
  /**
   * Create a new Mailchimp Webhook
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param listId {string} The identifier of the audience
   * @returns {object} Newly created webhook.
   */
  ${mailchimpCreateWebhook.toString()}
  `;

module.exports = {
  name: 'Create new Webhook',
  description: 'Create a new Mailchimp Webhook',
  code,
};
