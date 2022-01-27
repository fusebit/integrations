//////////////////////////////////////////////////////////////////////////////////////////
// Develop custom Google Sheets functions as properties of googleSheetsFunctions object.
// Use Node.js, any public NPM module, and Snippets to easily connect to external systems.
// Documentation: https://developer.fusebit.io/docs/google-sheets-addon
//////////////////////////////////////////////////////////////////////////////////////////

const Superagent = require('superagent');

const googleSheetsFunctions = {
  /**
   * The default Fusebit function that can be called with `=FUSEBIT(data)` from Google Sheets.
   *
   * @param context Fusebit request context
   * @param {string|number|Array<Array<string|number>>} data A Google Sheets cell or cell range.
   * @param {object} charts A map of a chart title to a base64 encoded PNG image of the chart.
   * @returns A single value or a two-dimensional range of values
   */
  default: async (ctx, data, charts) => {
    return 'Almost there! Go to Extensions | Fusebit | Open and click Edit to implement this function in Node.js';
  },

  /**
   * Doubles a number or range of numbers.
   * Call with `=FUSEBIT(data, "double")` from Google Sheets.
   *
   * @param context Fusebit request context
   * @param {string|number|Array<Array<string|number>>} data A Google Sheets cell or cell range.
   * @param {object} charts A map of a chart title to a base64 encoded PNG image of the chart.
   * @returns A single value or a two-dimensional range of values
   */
  double: async (ctx, data, charts) => {
    return Array.isArray(data) ? data.map((row) => row.map((cell) => cell * 2)) : data * 2;
  },

  /**
   * Returns the number of new COVID-19 cases for a US state or range or states.
   * Call with `=FUSEBIT(data, "covidNewCasesByState")` from Google Sheets.
   *
   * @param context Fusebit request context
   * @param {string|number|Array<Array<string|number>>} data A Google Sheets cell or cell range with US state symbols.
   * @param {object} charts A map of a chart title to a base64 encoded PNG image of the chart.
   * @returns A single value or a two-dimensional range of values
   */
  covidNewCasesByState: async (ctx, data, charts) => {
    const response = await Superagent.get(
      'https://api.covidactnow.org/v2/states.json?apiKey=175f5ee1a558415fbe4ba2ecfd9a6ea1'
    );
    const states = {};
    response.body.forEach((entry) => {
      states[entry.state] = entry;
    });
    return Array.isArray(data)
      ? data.map((row) => row.map((cell) => states[cell]?.actuals.newCases || 'N/A'))
      : states[data]?.actuals.newCases || 'N/A';
  },

  /**
   * Returns the weather forecast for the [ lat, long ] location in the US.
   * Call with `=FUSEBIT(a1:b1, "covidNewCasesByState")` from Google Sheets.
   *
   * @param context Fusebit request context
   * @param {string|number|Array<Array<string|number>>} data A range with one row and two cells with desired [lat,long]
   * @param {object} charts A map of a chart title to a base64 encoded PNG image of the chart.
   * @returns Weather forecast for the location
   */
  weather: async (ctx, data, charts) => {
    if (!Array.isArray(data) || data.length !== 1 || data[0].length < 2) {
      throw new Error("The 'weather' function requires a range with one row and two cells with lat and long as input");
    }
    try {
      const weatherUrl = `https://api.weather.gov/points/${data[0][0]},${data[0][1]}`;
      let response = await Superagent.get(weatherUrl).set('User-Agent', 'fusebit-gsheets-addon');
      const forecastUrl = response.body?.properties?.forecast;
      response = await Superagent.get(forecastUrl).set('User-Agent', 'fusebit-gsheets-addon');
      const forecast = response.body?.properties?.periods?.[0]?.detailedForecast;
      return forecast;
    } catch (e) {
      throw new Error(`Error getting forecast for [ lat, long ] location ${data[0]}. Error: ${e.stack || e.message}`);
    }
  },
};

//////////////////////////////////////////////////////////////////////////////////////////
// End of custom Google Sheets functions.
// Boilerplate integration code follows - you will unlikely need to change it.
//////////////////////////////////////////////////////////////////////////////////////////

const { Integration } = require('@fusebit-int/framework');
const integration = (module.exports = new Integration());

const authorize = async (ctx, next) => {
  const expectedApiKey = ctx.state.manager.config.configuration.apiKey;
  if (!expectedApiKey) {
    return next();
  }
  const actualApiKey = ((ctx.req.headers['authorization'] || '').match(/^bearer\s+(.+)$/i) || [])[1];
  return expectedApiKey === actualApiKey ? next() : ctx.throw(403);
};

integration.router.get('/api/function', async (ctx) => {
  const data = Object.keys(googleSheetsFunctions);
  const i = data.indexOf('default');
  if (i >= 0) {
    data[i] = '<default>';
  }
  ctx.body = { data: data.sort() };
});

integration.router.post('/api/tenant/:tenantId/test', async (ctx) => {
  ctx.body = { message: `Success!` };
});

integration.router.post('/api/run', authorize, async (ctx) => {
  console.log('RUNNING GOOGLE SHEETS FUNCTION', {
    functionName: ctx.req.body?.functionName,
    data: ctx.req.body?.data,
    charts: Object.keys(ctx.req.body?.charts || {}),
  });
  try {
    const functionName = ctx.req.body.functionName || 'default';
    const f = googleSheetsFunctions[functionName];
    if (typeof f !== 'function') {
      throw new Error(
        `Custom Fusebit function "${functionName}" does not exist. Available functions are: ${Object.keys(
          googleSheetsFunctions
        )
          .sort()
          .join(', ')}.`
      );
    }
    const data = await f(ctx, ctx.req.body?.data, ctx.req.body?.charts || {});
    console.log('RESULT', data);
    ctx.body = { data };
  } catch (e) {
    console.log('ERROR', e.stack || e.message || e);
    ctx.body = { error: e.stack || e.message || 'Unknown error' };
  }
});
