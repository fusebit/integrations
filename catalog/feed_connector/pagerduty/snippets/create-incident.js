async function pagerdutyCreateIncident(ctx, incidentTitle, incidentServiceID, incidentDescription) {
  // For the PagerDuty SDK documentation, see https://github.com/PagerDuty/pdjs
  const pagerdutyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const createdIncident = await pagerdutyClient.post('/incidents', {
    data: {
      incident: {
        type: 'incident',
        title: incidentTitle,
        service: {
          id: incidentServiceID,
          type: 'service',
        },
        body: {
          type: 'incident_body',
          details: incidentDescription,
        },
      },
    },
  });

  return createdIncident;
}

const code = `
  /**
   * Create new Incident for a specific service in PagerDuty
   * 
   * @param ctx {FusebitContext} Fusebit Context
   * @param incidentTitle {string} Incident Title
   * @param incidentServiceID {string} Service ID 
   * @param incidentDescription {string} Description of Incident
   */
  ${pagerdutyCreateIncident.toString()}
  `;

module.exports = {
  name: 'Create new Incident for a specific service in PagerDuty',
  description: 'Create new Incident for a specific service in PagerDuty using Title, Service ID and Description',
  code,
};
