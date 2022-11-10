async function listUserEvents(ctx, uuid) {
  // Learn more at https://developer.calendly.com/api-docs/2d5ed9bbd2952-list-events
  const calendlyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const {
    resource: { uri },
  } = await calendlyClient.get(`/users/${uuid}`);

  const { collection } = await calendlyClient.get(`/scheduled_events?user=${uri}`);

  return collection;
}

const code = `
    /**
     * List user events
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param uuid {string} User unique identifier, or the constant "me" to reference the caller
     */
    ${listUserEvents.toString()}
    `;

module.exports = {
  name: 'List specific user events',
  description: 'List user events by user unique identifier, or the constant "me" to reference the caller',
  code,
};
