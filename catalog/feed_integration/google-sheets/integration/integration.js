const { Integration } = require('@fusebit-int/framework');
const integration = new Integration();

// Koa Router: https://koajs.com/
const router = integration.router;
const connectorName = 'googleConnector';

// Test Endpoint: Get the openid and email of the currently authenticated user
router.post('/api/tenant/:tenantId/test', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Using a Public Google Sheets: https://docs.google.com/spreadsheets/d/1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4/
  const spreadsheetId = '1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4';
  const range = 'A1:Z1000';

  // Fetch the desired spreadsheet rows
  // API Reference: https://developers.google.com/sheets/api/guides/concepts
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

// Endpoint for Sample App: Retrieve "Food Items" from Spreadsheet & Map into Grocery List
router.get('/api/tenant/:tenantId/items', integration.middleware.authorizeUser('install:get'), async (ctx) => {
  // API Reference: https://developer.fusebit.io/reference/fusebit-int-framework-integration
  const googleClient = await integration.tenant.getSdkByTenant(ctx, connectorName, ctx.params.tenantId);

  // Using a Public Google Sheets: https://docs.google.com/spreadsheets/d/1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4/
  const spreadsheetId = '1__6I6SzTJ7JRWM5WMYdkrA6RE9J6YuGzAgGJvD4lrA4';

  // Retrieve Grouping Information from Spreadsheet
  // API Reference: https://developers.google.com/sheets/api/guides/concepts
  const metadata = await googleClient.sheets('v4').spreadsheets.get({ spreadsheetId });
  const { rowGroups: groups } = metadata.data.sheets[0];
  const {
    range: { endIndex },
  } = groups[groups.length - 1];

  // Fetch the desired spreadsheet rows
  const {
    data: { values },
  } = await googleClient.sheets('v4').spreadsheets.values.get({
    spreadsheetId,
    range: `A1:${endIndex}`,
  });

  // Create object from Row Values
  const groupList = [];
  groups.forEach(({ range: { startIndex, endIndex } }) => {
    const groupData = values.slice(startIndex - 1, endIndex).flat();
    const groupItems = groupData.slice(1, endIndex);

    groupItems.forEach((value, i) => {
      groupList.push({
        foodType: groupData[0], // First item will be always the group name
        foodItem: groupItems[i],
      });
    });
  });

  ctx.body = groupList;
});

module.exports = integration;
