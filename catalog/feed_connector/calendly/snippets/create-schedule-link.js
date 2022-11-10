async function createScheduleLink(ctx, owner) {
  // Learn more at https://developer.calendly.com/api-docs/4b8195084e287-create-single-use-scheduling-link
  const calendlyClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  return calendlyClient.post('/scheduling_links', {
    max_event_count: 1,
    owner,
    owner_type: 'EventType',
  });
}

const code = `
    /**
     * Creates a single-use scheduling link
     * 
     * @param ctx {FusebitContext} Fusebit Context of the request
     * @param owner {string} A link to the resource that owns this Scheduling Link (currently, this is always an Event Type)
     */
    ${createScheduleLink.toString()}
    `;

module.exports = {
  name: 'Create a single-use scheduling link',
  description: 'Create a single-use scheduling link',
  code,
};
