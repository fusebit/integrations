async function mailchimpAddAudienceContact(ctx, listId, subscribingUser) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/guides/create-your-first-audience/
  const mailchimpClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const addedContact = await mailchimpClient.marketing.lists.addListMember(listId, {
    email_address: subscribingUser.email,
    // Use subscribed to immediately add a contact.
    // Use pending to send a confirmation email. Once confirmed, the contact’s status will update to subscribed.
    status: 'subscribed',
    merge_fields: {
      FNAME: subscribingUser.firstName,
      LNAME: subscribingUser.lastName,
    },
  });

  return addedContact;
}

const code = `
    /**
     * Add a new Mailchimp audience contact
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param listId {string} The audience list identifier
     * @param subscribingUser {object} The contact information (firstName, lastName, email)
     * @returns {object} Newly created audience contact.
     */
    ${mailchimpAddAudienceContact.toString()}
    `;

module.exports = {
  name: 'Create new audience contact',
  description: 'Create a new Mailchimp audience contact',
  code,
};
