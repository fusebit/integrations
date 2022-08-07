async function bambooHRGetEmployee(ctx, id) {
  // For BambooHR Employee API documentation, see https://documentation.bamboohr.com/reference/get-employee
  const bambooHRWebhookClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const employee = await bambooHRWebhookClient.get(`employees/${id}?fields=displayName,jobTitle`);

  return employee;
}

const code = `
  /**
   * Get a BambooHR Employee
   * 
   * @param ctx {FusebitContext} Fusebit Context of the request
   * @param id {string} The id of the employee to get
   * @returns {object} BambooHR Employee
   */
  ${bambooHRGetEmployee.toString()}
  `;

module.exports = {
  name: 'Get Employee',
  description:
    'Get employee data by specifying a set of fields. This is suitable for getting basic employee information, including current values for fields that are part of a historical table, like job title, or compensation information',
  code,
};
