async function mailchimpRemoveAudienceContact(ctx, subscriberHash) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/guides/create-your-first-audience/
  const mailchimpClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const contactStatus = await mailchimpClient.marketing.lists.updateListMember(listId, subscriberHash, {
    status: 'unsubscribed',
  });

  return contactStatus;
}

const code = `
    /**
     * Remove Mailchimp audience contact
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param listId {string} The audience list identifier
     * @param subscriberHash {string} A MD5 hash of the contact’s lowercase email address
     * @returns {object} An object with the contact status (unsubscribed, cleaned)
     */
    ${mailchimpRemoveAudienceContact.toString()}
    `;

module.exports = {
  name: 'Remove an audience contact',
  description: 'Remove a Mailchimp audience contact',
  code,
};
