const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'google-connector-432';

// Test Endpoint: Get the openid and email of the currently authenticated user
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Using a Public Google Sheets: https://docs.google.com/spreadsheets/d/1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4/
  const spreadsheetId = '1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4';
  const range = 'A1:Z1000';

  // Fetch the desired spreadsheet rows
  const {
    data: { values },
  } = await googleClient.sheets('v4').spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  ctx.body = {
    Message: `Success! We found the following items in this spreadsheet: ${values}`,
  };
});

module.exports = integration;
