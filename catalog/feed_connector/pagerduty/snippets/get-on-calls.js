async function pagerdutyGetOnCalls(ctx) {
  // For the PagerDuty SDK documentation, see https://github.com/PagerDuty/pdjs
  const pagerdutyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return await pagerdutyClient.get(`/oncalls?include[]=users`);
}

const code = `
  /**
   * Get a list of On-Call Users & Escalation Policies
   * 
   * @param ctx {FusebitContext} Fusebit Context
   */
  ${pagerdutyGetOnCalls.toString()}
  `;

module.exports = {
  name: 'Get a list of On-Call Users & Escalation Policies',
  description: 'Get a list of On-Call Users & Escalation Policies',
  code,
};
