async function googleCalendarGetCalendars(ctx) {
  // For the Calendar SDK documentation, see https://developers.google.com/calendar/v3/docs/
  const googleClient = await integration.tenant.getSdkByTenant(
    ctx,
    '<% connectorName %>',
    ctx.params.tenantId || '<% defaultTenantId %>'
  );

  const calendar = await googleClient.calendar({ version: 'v3' });
  return await calendar.calendarList.list({ maxResults: 10 });
}

const code = `
/**
 * Returns a list of calendars belonging to the authenticated user.
 * 
 * @param ctx {FusebitContext} Fusebit Context
 * 
 */
${googleCalendarGetCalendars.toString()}
`;

module.exports = {
  name: 'Get List of Calendars',
  description: 'If users have multiple calendars, this will a list with IDs and names.',
  code,
};
