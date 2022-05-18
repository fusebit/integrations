async function mailchimpCreateAudience(ctx, eventName, contact, campaignDefaults) {
  // For the Mailchimp Marketing SDK documentation, see https://mailchimp.com/developer/marketing/guides/create-your-first-audience/
  const mailchimpClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const createdAudience = await mailchimpClient.marketing.lists.createList({
    name: eventName,
    contact,
    permission_reminder: 'permission_reminder',
    email_type_option: true,
    campaign_defaults: campaignDefaults,
  });

  return createdAudience;
}

const code = `
  /**
   * Create a new Mailchimp audience
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param name {string} The name of the event
   * @param contact {object} The contact information for the event
   * @param campaignDefaults {object} Configure email campaign information
   * @returns {object} Newly created audience.
   * 
   * @example
   *  const footerContactInfo = {
   *     company: 'Mailchimp',
   *     address1: '675 Ponce de Leon Ave NE',
   *     address2: 'Suite 5000',
   *     city: 'Atlanta',
   *     state: 'GA',
   *     zip: '30308',
   *     country: 'US'
   *  };
   * 
   * const campaignDefaults = {
   *   from_name: 'Gettin' Together',
   *   from_email: 'gettintogether@example.com',
   *   subject: 'JS Developers Meetup',
   *   language: 'EN_US'
   * };
   * 
   *  const audience = await mailchimpCreateAudience(ctx, 'JS Developers Meetup', footerContactInfo, campaignDefaults);
   * 
   */
  ${mailchimpCreateAudience.toString()}
  `;

module.exports = {
  name: 'Create new audience',
  description: 'Create a new Mailchimp audience',
  code,
};
