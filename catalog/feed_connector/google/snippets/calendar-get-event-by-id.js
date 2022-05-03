async function googleCalendarGetEventbyId(ctx, calendarId, eventId) {
  // For the Calendar SDK documentation, see https://developers.google.com/calendar/v3/docs/
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const calendar = await googleClient.calendar({ version: 'v3' });
  return await calendar.events.get({ calendarId: calendarId, eventId: eventId });
}

const code = `
/**
 * Returns Event Details for a Specific Event.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * @param calendarId {String} The ID of the calendar to get events from
 * @param eventId {String} The ID of the event to get
 * 
 */
${googleCalendarGetEventbyId.toString()}
`;

module.exports = {
  name: 'Get Event by ID',
  description: 'Get Full Details of a Calendar Event by ID.',
  code,
};
