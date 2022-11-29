async function cancelEvent(ctx, uuid, reason) {
  // Learn more at https://developer.calendly.com/api-docs/afb2e9fe3a0a0-cancel-event
  const calendlyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return calendlyClient.post(`/scheduled_events/${uuid}/cancellation`, { reason });
}

const code = `
    /**
     * Cancels specified event.
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param uuid {string} The event's unique identifier
     * @param reason {string=} Optional cancellation reason
     */
    ${cancelEvent.toString()}
    `;

module.exports = {
  name: 'Cancels specified event',
  description: 'Cancels specified event',
  code,
};
