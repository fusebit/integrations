const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Count # of Events in Google Calendar
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const today = new Date();

  // API Reference: https://developers.google.com/calendar/api/v3/reference
  const calendar = await googleClient.calendar({ version: 'v3' });
  const calendarEvents = await calendar.events.list({
    calendarId: 'primary',
    timeMin: today,
  });

  ctx.body = {
    message: `Success! Your Primary calendar has ${calendarEvents.data.length} events after today.`,
  };
});

// Endpoint for Sample App: Retrieve Events from your Primary Google Calendar
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const today = new Date();

  const calendar = await googleClient.calendar({ version: 'v3' });
  const calendarEvents = await calendar.events.list({
    calendarId: 'primary',
    timeMin: today,
  });

  const calendarEventsList = calendarEvents.data.items.map((calendarItem) => {
    // Google Calendar API Returns Inconsistent Start Times
    // So this is a workaround to handle the data and normalize it
    let startTime = '';
    if (!calendarItem.start) {
      startTime = '';
    } else if (calendarItem.start.dateTime) {
      startTime = calendarItem.start.dateTime;
    } else if (calendarItem.start.date) {
      startTime = calendarItem.start.date;
    }
    return {
      StartDate: startTime,
      EventName: calendarItem.summary,
    };
  });

  ctx.body = calendarEventsList;
});

// Endpoint for Sample App: Use QuickAdd to add a New Event to your Google Calendar
router.post('/api/tenant/:tenantId/item', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);
  const quickAddText = ctx.req.body.eventName + ' ' + ctx.req.body.startDate;

  // Quick Add a New Event
  const calendar = await googleClient.calendar({ version: 'v3' });
  const addQuickEvent = await calendar.events.quickAdd({
    calendarId: 'primary',
    text: quickAddText,
  });

  ctx.body = addQuickEvent;
});

module.exports = integration;
