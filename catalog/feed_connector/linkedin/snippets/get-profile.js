async function linkedinGetProfile(ctx, personID) {
  // For the Linkedin SDK documentation, see https://docs.microsoft.com/en-us/linkedin/consumer/
  const linkedinClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  //To do multiple IDs in one call: `people?ids=List((id:{Person ID1}),(id:{Person ID2}),(id:{Person ID3}))`
  return await linkedinClient.get(`people/(id:{${personID}})`);
}

const code = `
/**
 * Get profiles of other members in LinkedIn
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param personID {string|object} Person ID(s)
 * @returns Profile object of requested LinkedIn member(s)
 */
${linkedinGetProfile.toString()}
`;

module.exports = {
  name: 'Retrive LinkedIn Profiles of Members',
  description: 'Retrive LinkedIn Profiles of Members',
  code,
};
